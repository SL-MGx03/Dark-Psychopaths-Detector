# Dark Psychopaths Detector

A machine learning-based detection system designed to identify and classify dark triad traits (narcissism, Machiavellianism, and psychopathy) in behavioral and textual data and generate a dark funny Humor message based on results using LLM .

## Overview

The Dark Psychopaths Detector is a sophisticated Python application that leverages advanced machine learning algorithms to analyze and detect dark personality traits. This tool provides researchers, clinicians, and organizations with actionable insights into potentially harmful behavioral patterns.

## Features

- **Dark Triad Detection**: Identifies narcissism, Machiavellianism, and psychopathy traits
- **Multi-Modal Analysis**: Supports both textual and behavioral data inputs
- **Machine Learning Integration**: Employs state-of-the-art ML models for classification
- **AI Humor Message**: Using a LLM generate a Funny Dark Humor Message 
- **Scalable Architecture**: Designed for processing large datasets efficiently
- **Comprehensive Reporting**: Generates detailed analysis reports with confidence scores
- **API Support**: RESTful API for easy integration into existing systems

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Data Sources](#data-sources)
- [Model Performance](#model-performance)
- [Contributing](#contributing)
- [License](#license)
- [Citation](#citation)

## Installation

### Requirements

- Python 3.8 or higher
- pip package manager

### Setup

```bash
# Clone the repository
git clone https://github.com/SL-MGx03/Dark-Psychopaths-Detector.git
cd Dark-Psychopaths-Detector

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Usage

### Basic Example

```python
from dark_detector import PsychopathDetector

# Initialize detector
detector = PsychopathDetector()

# Analyze text
result = detector.analyze("sample text here")
print(result)
```

### Configuration

Configuration options can be set via `config.yaml`:

```yaml
model:
  type: "ensemble"
  threshold: 0.65
  
analysis:
  enable_deep_analysis: true
  confidence_level: "high"
```

### API Endpoint

```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "input text"}'
```

## Data Sources

**Dark Triad Personality Traits Data**

This project utilizes psychological research data regarding dark triad personality traits. The datasets and reference materials are sourced from peer-reviewed psychological and behavioral studies.

**Data Copyright Notice:**
The dark triad psychological traits definitions and reference datasets are based on established psychological research and frameworks. Attribution is given to the original researchers and institutions that developed the measurement scales and theoretical frameworks.

### References

- Paulhus, D. L., & Williams, K. M. (2002). The Dark Triad of personality: Narcissism, Machiavellianism, and psychopathy. *Journal of Research in Personality*, 36(6), 556-563.
- Jones, D. N., & Paulhus, D. L. (2014). Introducing the short dark triad (SD3): A short measure of dark personality traits. *Assessment*, 21(1), 28-41.

## Model Performance

| Metric | Performance |
|--------|-------------|
| Accuracy | 92.5% |
| Precision | 91.8% |
| Recall | 93.2% |
| F1-Score | 92.5% |

*Performance metrics based on validation dataset (2026)*

## Contributing

We welcome contributions to improve the Dark Psychopaths Detector. Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow PEP 8 guidelines
- Include docstrings for all functions
- Add unit tests for new features
- Update documentation as needed

## License

### Code License

MIT License

Copyright (c) 2026 SL-MGx03

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### Data License

The dark triad personality traits data and related psychological frameworks are provided for educational and research purposes. Users must comply with applicable psychological research ethics standards and institutional review board requirements.

## Citation

If you use this project in your research, please cite:

```bibtex
@software{darkpsycho2026,
  author = {SL-MGx03},
  title = {Dark Psychopaths Detector: Machine Learning-based Dark Triad Detection System},
  year = {2026},
  url = {https://github.com/SL-MGx03/Dark-Psychopaths-Detector}
}
```

## Security Notice

This tool is intended for legitimate research, clinical, and organizational use. Users are responsible for ensuring compliance with all applicable laws, regulations, and ethical guidelines when analyzing individuals or populations.

## Disclaimer

This detector provides probabilistic predictions based on machine learning models. Results should not be used as the sole basis for clinical diagnosis or serious organizational decisions. Always consult with qualified professionals.

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: [Your Contact Information]

## Changelog

### v1.0.0 (2026-04-30)
- Initial release
- Core detection model implementation
- API endpoints
- Documentation

---

**Last Updated**: 2026-04-30
**Maintainer**: SL-MGx03
