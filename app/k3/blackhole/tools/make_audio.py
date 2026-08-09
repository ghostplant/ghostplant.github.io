# Generate a seamless deep-space ambient drone -> audio/ambience.wav
import numpy as np, wave, struct, os

SR = 22050
DUR = 24.0
N = int(SR * DUR)
t = np.linspace(0, DUR, N, endpoint=False)
rng = np.random.default_rng(7)

def env_lfo(rate, depth, phase=0.0):
    return 1.0 - depth * (0.5 + 0.5 * np.sin(2*np.pi*rate*t + phase))

# Detuned drone partials (A0 root)
partials = [(55.0,1.0),(55.0*1.5,0.5),(55.0*2.0,0.34),(55.0*2.997,0.22),(110.4,0.18),(55.0*4.0,0.1)]
sig = np.zeros(N)
for f,a in partials:
    det = 1.0 + rng.uniform(-0.0015,0.0015)
    sig += a * np.sin(2*np.pi*f*det*t) * env_lfo(rng.uniform(0.02,0.08), 0.4, rng.uniform(0,6))
sig /= np.max(np.abs(sig))

# Brown-ish noise "wind"
white = rng.standard_normal(N)
b = np.cumsum(white); b -= np.linspace(b[0], b[-1], N)
b /= np.max(np.abs(b))
# simple lowpass via fft
def lowpass(x, cutoff):
    X = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(len(x), 1/SR)
    X *= 1.0 / (1.0 + (freqs/cutoff)**2)
    return np.fft.irfft(X, len(x))
wind = lowpass(b, 300.0) * env_lfo(0.05, 0.6)
wind /= np.max(np.abs(wind))

mix = 0.75*sig + 0.22*wind
# stereo: slight haas + independent noise
mixL = mix
mixR = np.roll(mix, int(0.012*SR)) * 0.9 + 0.1*lowpass(rng.standard_normal(N), 200.0)
st = np.stack([mixL, mixR], axis=1)
# reverb (exponential decay convolution, short)
ir_len = int(0.6*SR)
ir = rng.standard_normal(ir_len) * np.exp(-6*np.linspace(0,1,ir_len))
ir /= np.sum(np.abs(ir))
def reverb(x):
    from numpy.fft import rfft, irfft
    L = len(x)+ir_len
    return irfft(rfft(x, L)*rfft(ir, L), L)[:len(x)]
stL = reverb(st[:,0]); stR = reverb(st[:,1])
out = np.stack([0.7*st[:,0]+0.5*stL, 0.7*st[:,1]+0.5*stR], axis=1)
# seamless loop crossfade
fade = int(2.0*SR)
out[:fade] = out[:fade] * (np.linspace(0,1,fade))[:,None] + out[-fade:] * (np.linspace(1,0,fade))[:,None]
out = out[:N]
out /= np.max(np.abs(out)) * 1.05
out = (out * 0.6 * 32767).astype(np.int16)

os.makedirs('audio', exist_ok=True)
with wave.open('audio/ambience.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(out.tobytes())
print('wrote audio/ambience.wav', out.shape, os.path.getsize('audio/ambience.wav')//1024, 'KB')
