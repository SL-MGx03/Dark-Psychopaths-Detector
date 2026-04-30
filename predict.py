import torch
import pandas as pd
from Neural_Network import DarkTriad

def get_scores(csv_path, model_path):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = DarkTriad().to(device)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()

    df = pd.read_csv(csv_path, sep='\t')

    flip_cols = ['N2', 'N6', 'N8', 'P2', 'P7']
    for col in flip_cols:
        df[col] = 6 - df[col]

    data = df.values.astype('float32')
    data = (data - 1) / 4.0
    input_tensor = torch.from_numpy(data).to(device)


    with torch.inference_mode():
        encoded_scores, _ = model(input_tensor)
        
    return encoded_scores.cpu().squeeze().tolist()

def report_to_llm(file_name):
    scores = get_scores(file_name, 'dark_triad_model.pth')
    traits = ["Machiavellianism", "Narcissism", "Psychopathy"]
    
    print("--- Analysis Results ---")
    for trait, score in zip(traits, scores):
        print(f"{trait}: {score:.2f}")

    return (f"Results: Machiavellianism={scores[0]:.2f}, "
            f"Narcissism={scores[1]:.2f}, "
            f"Psychopathy={scores[2]:.2f}")