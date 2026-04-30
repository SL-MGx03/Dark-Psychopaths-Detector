const express  = require('express');
const router   = express.Router();
const axios    = require('axios');
const FormData = require('form-data');
const rateLimit = require('express-rate-limit');
const Result   = require('../models/Result');

const API_BASE = process.env.API_BASE || 'https://pd.api.slmgx.edu.lk';
const SITE_URL = process.env.SITE_URL || 'https://slmgx.edu.lk/dark-traid';

// Rate limiter for the expensive AI-analysis endpoint
const submitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many submissions. Please wait a few minutes and try again.'
});

// SD3 questionnaire definition
const QUESTIONS = {
  machiavellianism: [
    { id: 'M1', text: "It's not wise to tell your secrets." },
    { id: 'M2', text: "I like to use clever manipulation to get my way." },
    { id: 'M3', text: "Whatever it takes, you must get the important people on your side." },
    { id: 'M4', text: "Avoid direct conflict with others because they may be useful in the future." },
    { id: 'M5', text: "It's wise to keep track of information that you can use against people later." },
    { id: 'M6', text: "You should wait for the right time to get back at people." },
    { id: 'M7', text: "There are things you should hide from other people to preserve your reputation." },
    { id: 'M8', text: "Make sure your plans benefit yourself, not others." },
    { id: 'M9', text: "Most people can be manipulated." }
  ],
  narcissism: [
    { id: 'N1', text: "People see me as a natural leader." },
    { id: 'N2', text: "I hate being the center of attention." },
    { id: 'N3', text: "Many group activities tend to be dull without me." },
    { id: 'N4', text: "I know that I am special because everyone keeps telling me so." },
    { id: 'N5', text: "I like to get acquainted with important people." },
    { id: 'N6', text: "I feel embarrassed if someone compliments me." },
    { id: 'N7', text: "I have been compared to famous people." },
    { id: 'N8', text: "I am an average person." },
    { id: 'N9', text: "I insist on getting the respect that is due to me." }
  ],
  psychopathy: [
    { id: 'P1', text: "I like to get revenge on authorities." },
    { id: 'P2', text: "I avoid dangerous situations." },
    { id: 'P3', text: "Payback needs to be quick and nasty." },
    { id: 'P4', text: "People often say I'm out of control." },
    { id: 'P5', text: "It's true that I can be mean to others." },
    { id: 'P6', text: "People who mess with me always regret it." },
    { id: 'P7', text: "I have never gotten into trouble with the law." },
    { id: 'P8', text: "I enjoy having sex with people I hardly know." },
    { id: 'P9', text: "I'll say anything to get what I want." }
  ]
};

const ALL_QUESTIONS_ORDERED = [
  ...QUESTIONS.machiavellianism,
  ...QUESTIONS.narcissism,
  ...QUESTIONS.psychopathy
];

// GET / — Landing page
router.get('/', (req, res) => {
  res.render('index', {
    title: 'Dark Triad Detector',
    siteUrl: SITE_URL,
    error: req.query.error || null
  });
});

// POST /start — Save nickname, redirect to quiz
router.post('/start', (req, res) => {
  const nickname = (req.body.nickname || '').trim();
  if (!nickname || nickname.length < 2 || nickname.length > 40) {
    return res.redirect(req.baseUrl + '/?error=Please+enter+a+valid+nickname+(2–40+characters).');
  }
  req.session.nickname = nickname;
  req.session.quizStarted = true;
  res.redirect(req.baseUrl + '/quiz');
});

// GET /quiz — Questionnaire page
router.get('/quiz', (req, res) => {
  if (!req.session.nickname) return res.redirect(req.baseUrl + '/');
  res.render('quiz', {
    title: 'Dark Triad Quiz',
    nickname: req.session.nickname,
    questions: QUESTIONS,
    allQuestions: ALL_QUESTIONS_ORDERED,
    siteUrl: SITE_URL
  });
});

// POST /submit — Process answers, call Python API, save to MongoDB
router.post('/submit', submitLimiter, async (req, res) => {
  if (!req.session.nickname) return res.redirect('/');

  try {
    const nickname = req.session.nickname;
    const answers = ALL_QUESTIONS_ORDERED.map(q => {
      const val = parseInt(req.body[q.id], 10);
      if (isNaN(val) || val < 1 || val > 5) {
        throw new Error(`Invalid answer for ${q.id}`);
      }
      return val;
    });

    // Build tab-separated CSV content
    const header = ALL_QUESTIONS_ORDERED.map(q => q.id).join('\t');
    const row = answers.join('\t');
    const csvContent = `${header}\n${row}`;
    const csvBuffer = Buffer.from(csvContent, 'utf-8');

    // Send to Python API
    const formData = new FormData();
    formData.append('file', csvBuffer, {
      filename: 'responses.csv',
      contentType: 'text/csv'
    });

    let apiResponse;
    try {
      const response = await axios.post(`${API_BASE}/upload-results`, formData, {
        headers: formData.getHeaders(),
        timeout: 120000
      });
      apiResponse = response.data;
    } catch (apiErr) {
      console.error('API error:', apiErr.response?.data || apiErr.message);
      return res.redirect(req.baseUrl + '/quiz?error=analysis_failed');
    }

    const report = apiResponse.report || {};
    const fullText = apiResponse.full_text || '';

    // Attempt to extract scores from the full text (fallback: 0)
    const scoreMatch = fullText.match(
      /Machiavellianism=([\d.]+),\s*Narcissism=([\d.]+),\s*Psychopathy=([\d.]+)/i
    );
    const scores = {
      machiavellianism: scoreMatch ? parseFloat(scoreMatch[1]) : 0,
      narcissism: scoreMatch ? parseFloat(scoreMatch[2]) : 0,
      psychopathy: scoreMatch ? parseFloat(scoreMatch[3]) : 0
    };

    // Save to MongoDB
    const resultDoc = await Result.create({
      nickname,
      sessionId: req.session.id,
      scores,
      report,
      fullText,
      answers
    });

    req.session.resultId = resultDoc._id.toString();
    res.redirect(req.baseUrl + '/result');
  } catch (err) {
    console.error('Submit error:', err);
    res.redirect(req.baseUrl + '/quiz?error=Please+answer+all+questions.');
  }
});

// GET /result — Show result
router.get('/result', async (req, res) => {
  if (!req.session.resultId) return res.redirect(req.baseUrl + '/');
  try {
    const result = await Result.findById(req.session.resultId).lean();
    if (!result) return res.redirect(req.baseUrl + '/');

    res.render('result', {
      title: `${result.nickname}'s Dark Profile`,
      nickname: result.nickname,
      scores: result.scores,
      report: result.report,
      fullText: result.fullText,
      siteUrl: SITE_URL
    });
  } catch (err) {
    console.error('Result fetch error:', err);
    res.redirect(req.baseUrl + '/');
  }
});

// GET /privacy — Privacy policy
router.get('/privacy', (req, res) => {
  res.render('privacy', { title: 'Privacy Policy', siteUrl: SITE_URL });
});

// GET /terms — Terms and conditions
router.get('/terms', (req, res) => {
  res.render('terms', { title: 'Terms & Conditions', siteUrl: SITE_URL });
});

module.exports = router;
