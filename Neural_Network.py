from torch import nn

class DarkTriad(nn.Module):
    def __init__(self):
        super().__init__()

        self.encoder= nn.Sequential(
            nn.Linear(27,12),
            nn.ReLU(),
            nn.Linear(12,3),
            nn.Sigmoid()
        )

        self.decoder= nn.Sequential(
            nn.Linear(3,12),
            nn.ReLU(),
            nn.Linear(12,27),
            nn.Sigmoid()
        )


    def forward(self, x):
        encoded= self.encoder(x)
        decoded= self.decoder(encoded)
        return encoded, decoded
