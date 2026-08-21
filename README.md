# Dark Triad Personality Analysis System

## Overview
This repository contains an experimental Python project that implements a small neural autoencoder to produce three continuous trait scores corresponding to the Dark Triad (Machiavellianism, Narcissism, Psychopathy) from questionnaire-style input. The code is research/experiment-oriented and intended for demonstration and analysis; it is not a clinical diagnostic tool.

The "Dark Triad" refers to three correlated personality traits commonly studied in psychology:
- Machiavellianism — manipulativeness and strategic calculation
- Narcissism — entitlement and grandiosity
- Psychopathy — callousness and impulsivity

This project implements a compact neural autoencoder (PyTorch) that maps 27 questionnaire items -> a 3-dimensional encoded representation -> reconstructs the input. The encoded 3-dim vector is used as the trait estimates.

> Disclaimer: This project is an experimental machine learning project
> for analyzing Dark Triad personality-related data. It is not a medical,
> psychological, or clinical diagnostic tool, and its predictions should not
> be interpreted as professional psychological assessment or diagnosis.

## Key Features
- PyTorch autoencoder model that encodes 27 questionnaire inputs to a 3-dimensional latent vector.
- Input pipeline that reads tab-separated questionnaire CSV files (pandas).
- Inverse-scoring for specific questionnaire items (implemented).
- Input normalization that maps typical Likert-style responses (1–5) to [0, 1].
- Simple inference utilities in predict.py that load a trained model, run inference, and format results.
- Optional LLM-based reporting glue (langchain/ChatGroq integration) that uses model outputs to generate a human-readable report (requires external API keys and the LangChain/ChatGroq stack).

## Technical Approach

1. Input / data format
   - Expects a tab-separated CSV file. The code reads input using:
     df = pd.read_csv(csv_path, sep='\t')
   - The dataframe is expected to contain 27 item columns corresponding to questionnaire item codes used in the implementation.

2. Data loading
   - predict.get_scores(csv_path, model_path) loads the CSV via pandas and reads numeric columns into a numpy array:
     data = df.values.astype('float32')

3. Data preprocessing
   - Inverse scoring: For the columns listed in code, values are flipped using 6 - X:
     flip_cols = ['N2', 'N6', 'N8', 'P2', 'P7']
     for col in flip_cols:
         df[col] = 6 - df[col]
   - Normalization: After inverse scoring, raw item values are scaled using:
     data = (data - 1) / 4.0
     This maps responses in the 1–5 range to approximately 0.0–1.0.

4. Any inverse scoring or normalization
   - As above: specific flip columns are adjusted with 6 - X, followed by (x - 1) / 4.0 normalization.

5. Feature preparation
   - The full row vector of 27 normalized item responses is used directly as the model input tensor. There is no additional feature engineering, tokenization, or text embedding in the repository.

6. Model architecture
   - Framework: PyTorch
   - Model: DarkTriad autoencoder defined in Neural_Network.py
     - Encoder: Linear(27 -> 12) -> ReLU -> Linear(12 -> 3) -> Sigmoid
     - Decoder: Linear(3 -> 12) -> ReLU -> Linear(12 -> 27) -> Sigmoid
   - Forward pass returns (encoded, decoded). The encoded output is the 3-dimensional latent score vector (values in (0,1) due to Sigmoid).

7. Model inference / prediction
   - predict.get_scores:
     - Creates DarkTriad(), moves to device (cuda if available), loads state_dict from the provided model path, sets eval mode.
     - Converts preprocessed data to a torch tensor, runs inference under torch.inference_mode(), and returns the encoded scores as Python floats:
       encoded_scores, _ = model(input_tensor)

8. Post-processing / output
   - Encoded scores are returned as a list of floats corresponding to:
     [Machiavellianism, Narcissism, Psychopathy]
   - predict.report_to_llm wraps get_scores and prints a textual summary; it also formats a simple string suitable for passing to an LLM-based reporter.

9. LLM integration (present in the repository)
   - core.py wires model outputs to a LangChain agent that uses ChatGroq (llm = ChatGroq(...)) with a SYSTEM_PROMPT defined in prompt.py.
   - The LangChain agent exposes two tools:
     - get_dark_triad_scores(file_path: str): calls report_to_llm(file_path) (which internally loads the model weights and runs get_scores).
     - get_trait_definitions(): attempts to open and return `codebook.txt` (note: repository does not include codebook.txt).
   - Running the agent requires environment variables (e.g., GROQ_API_KEY) and the ChatGroq integration listed in requirements.txt. The LLM prompt intentionally formats an irreverent/humorous tone; it is present in prompt.py and is part of the experimental reporting layer.

## Data Processing (exact behavior implemented)
- File reading: pandas.read_csv(..., sep='\t')
- Inverse scoring: For the columns 'N2', 'N6', 'N8', 'P2', 'P7' the code performs 6 - X.
- Normalization: After flipping, the code uses (value - 1) / 4.0 to map expected 1–5 Likert responses to 0–1.
- Model input shape: Each input row is a length-27 float vector; the model's first Linear layer expects 27 inputs.

## Machine Learning Model
- Framework: PyTorch (torch)
- Architecture: Autoencoder with encoder (27 → 12 → 3) and decoder (3 → 12 → 27). Encoder final activation is Sigmoid so encoded outputs fall in (0,1).
- Input dimension: 27
- Latent / output dimension: 3 (interpreted by the code as the three Dark Triad traits)
- Training: No training script is included in the repository. The inference code expects a checkpoint file at the path passed to get_scores (example usage passes 'dark_triad_model.pth').
- Intended estimate: The encoded 3-dim vector is used as continuous trait estimates; the model is an autoencoder, not a classifier.

## Evaluation
- The repository does not include training logs, evaluation scripts, or reproducible metric calculations. There are no verifiable evaluation results in the codebase.
- Any performance numbers in the original README are not supported by code or experiment artifacts in this repository and therefore are not reported here.

## Project Structure (important files)
- Neural_Network.py — PyTorch module defining the DarkTriad autoencoder (encoder and decoder, forward returns encoded and decoded tensors).
- predict.py — Inference utilities:
  - get_scores(csv_path, model_path): loads model, preprocesses CSV input (inverse scoring + normalization), runs inference, returns encoded scores.
  - report_to_llm(file_name): wrapper that calls get_scores and formats/prints results.
- core.py — LangChain/ChatGroq integration and tool wrappers; defines tools that call predict.report_to_llm and attempt to read a codebook. Requires external LLM API key and network access.
- prompt.py — System prompt used by the LLM agent; defines tone and structure of generated reports.
- requirements.txt — Project dependencies (torch, pandas, numpy, langchain, langchain_google_genai, langchain_groq, python-dotenv, fastapi, uvicorn, python-multipart, matplotlib, tqdm).
- LICENSE — GNU GPL v3 (the repository's license).
- README.md — (this file)

Notes:
- The repository references a codebook file (codebook.txt) and a model checkpoint (e.g., `dark_triad_model.pth`) but those files are not present in the repository at the time of inspection. They are required for full functionality.

## Installation
Recommended environment: Python 3.8+.

1. Clone and enter repo
   ```
   git clone https://github.com/SL-MGx03/Dark-Psychopaths-Detector.git
   cd Dark-Psychopaths-Detector
   ```

2. Create and activate a virtual environment
   - Unix/macOS:
     ```
     python -m venv venv
     source venv/bin/activate
     ```
   - Windows (PowerShell):
     ```
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```

3. Install dependencies
   ```
   pip install -r requirements.txt
   ```
   Note: Installing torch may require selecting a platform-specific wheel or a CUDA-enabled package — consult https://pytorch.org/get-started/locally/ for the recommended install command for your system.

4. Place required artifacts
   - Provide the trained model weights file at the path you will pass into get_scores (e.g., `dark_triad_model.pth`).
   - If you want the LLM reporting agent to reference question definitions, provide `codebook.txt` in the repository root.

## Usage examples

1. Inference (Python)
   ```python
   # Example usage from repository root
   from predict import get_scores
   # csv_path: path to a tab-separated CSV with 27 item columns
   # model_path: path to a PyTorch state_dict (e.g., dark_triad_model.pth)
   scores = get_scores("responses.tsv", "dark_triad_model.pth")
   # scores => [mach_score, narc_score, psych_score] as floats between 0 and 1
   print(scores)
   ```

2. LLM-based report (requires LangChain + ChatGroq and a valid GROQ_API_KEY)
   ```python
   from core import psycho_reader_agent
   # Returns agent invocation result; agent tools expect the same file path used above
   result = psycho_reader_agent("responses.tsv")
   print(result)
   ```
   - Environment: set GROQ_API_KEY and any other required LangChain provider keys in your environment or .env file.
   - The LLM integration calls `get_dark_triad_scores` (which internally runs get_scores) and `get_trait_definitions` (which attempts to open `codebook.txt`).

## API
- The repository contains no confirmed FastAPI application or endpoint definitions. Although `fastapi` and `uvicorn` are listed in requirements.txt, there is no `app.py` or equivalent server module in the codebase to document an API. Do not assume an HTTP endpoint exists without adding a server implementation.

## Limitations
- Experimental research code: the project demonstrates a compact autoencoder-based approach but lacks training scripts, evaluation artifacts, and data provenance.
- Missing artifacts: the repository references a checkpoint (`dark_triad_model.pth`) and `codebook.txt`, which are not included. Without them inference and LLM reporting cannot run.
- No evaluation or reproducible metrics are included in the codebase — there is nothing to validate model performance from this repository alone.
- The model is an autoencoder producing continuous latent values; these are not clinical diagnoses. Do not use outputs for clinical or high-stakes decisions.
- Questionnaire bias: personality inference from questionnaire responses is subject to response bias, sample bias, and other limitations common to psychometrics. This repository does not include bias analysis.

## Future improvements 
- Add a training script and configuration to reproduce checkpoints and training logs.
- Include or reference the data/codebook used for inputs so readers can validate preprocessing and mapping from items to item codes.
- Add evaluation scripts and stored validation results (train/val/test splits, metrics, and confusion analysis if transforming to classification).
- Improve input validation and robust handling of missing/invalid questionnaire items.
- Add unit tests for preprocessing, model forward pass, and end-to-end inference.
- Track experiments (e.g., with MLflow, Weights & Biases) for reproducibility and hyperparameter auditing.
- If an API is needed, add a minimal FastAPI app that calls predict.get_scores under controlled request limits and documents the endpoint.

## References
- Paulhus, D. L., & Williams, K. M. (2002). The Dark Triad of personality: Narcissism, Machiavellianism, and psychopathy. Journal of Research in Personality, 36(6), 556–563.
- Jones, D. N., & Paulhus, D. L. (2014). Introducing the short dark triad (SD3): A short measure of dark personality traits. Assessment, 21(1), 28–41.

## License
This repository is distributed under the GNU General Public License v3.0 (GPL-3.0). See the LICENSE file in the repository for details.
