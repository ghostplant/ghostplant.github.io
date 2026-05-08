#!/usr/bin/env python3
"""
Generate an improvised ~30-second jazz-inspired MIDI score.
Instruments: Piano (melody + chords), Bass (walking bass), Drums (brush kit).
Key: F major / D minor (aeolian), tempo ~120 BPM.
"""

import random
from midiutil import MIDIFile

random.seed(42)  # reproducible "improvisation"

# ── Configuration ──────────────────────────────────────────────────────────
BPM = 120
DURATION_SECONDS = 30
BEATS = int(BPM * DURATION_SECONDS / 60)  # ~60 beats at 120 BPM = 30s
TICKS_PER_Q = 1  # MIDIUtil uses whole-beat units by default

# MIDI program numbers
PIANO = 0
BASS = 32  # acoustic bass
DRUMS = 0  # channel 10 is percussion

# Channels
CH_MELODY = 0
CH_CHORDS = 1
CH_BASS = 2
CH_DRUMS = 9  # channel 10 (0-indexed = 9)

# ── Scale & Harmony ────────────────────────────────────────────────────────
# F major scale degrees (MIDI note numbers for reference)
F_MAJOR = [65, 67, 69, 70, 72, 74, 76, 77, 79, 81, 83, 84]  # F4 up
D_MINOR = [62, 64, 65, 67, 69, 70, 72, 74, 76, 77, 79, 81]  # D4 up
BLUES_F = [65, 68, 70, 71, 72, 75, 77, 80]  # F blues scale

# Chord voicings (root position & inversions, close voicings)
CHORDS = {
    'F':   [65, 69, 72],  # F4 A4 C5
    'F7':  [65, 69, 72, 75],  # F4 A4 C5 Eb5
    'Bb':  [70, 74, 77],  # Bb4 D5 F5
    'Bb7': [70, 74, 77, 80],
    'C':   [72, 76, 79],  # C5 E5 G5
    'C7':  [72, 76, 79, 82],
    'Dm':  [62, 65, 69],  # D4 F4 A4
    'Gm':  [67, 70, 74],  # G4 Bb4 D5
    'Am':  [69, 72, 76],  # A4 C5 E5
    'Gm7': [67, 70, 74, 77],
}

# Chord progression (2-bar units, each bar = 4 beats)
PROGRESSION = [
    ('F7',  4), ('Bb7', 4),   # bars 1-2
    ('F7',  4), ('C7',  4),   # bars 3-4
    ('Bb7', 4), ('F7',  4),   # bars 5-6
    ('Gm7', 4), ('C7',  4),   # bars 7-8
    ('F7',  4), ('Dm',  4),   # bars 9-10
    ('Gm7', 4), ('C7',  4),   # bars 11-12
    ('F7',  4), ('Bb7', 4),   # bars 13-14
    ('Gm7', 4), ('C7',  4),   # bars 15-16 (final cadence)
]

# ── Build MIDI ─────────────────────────────────────────────────────────────
midi = MIDIFile(4)  # 4 tracks: melody, chords, bass, drums
midi.addTempo(0, 0, BPM)

# Track names & programs
for track, ch, prog, name in [
    (0, CH_MELODY, PIANO, "Melody"),
    (1, CH_CHORDS, PIANO, "Chords"),
    (2, CH_BASS,   BASS,  "Bass"),
    (3, CH_DRUMS,  DRUMS, "Drums"),
]:
    midi.addTrackName(track, 0, name)
    if ch != CH_DRUMS:
        midi.addProgramChange(track, ch, 0, prog)

# ── 1. Melody ──────────────────────────────────────────────────────────────
# Rhythmic patterns (beat subdivisions): each value is duration in beats
RHYTHM_PATTERNS = [
    [1.0],
    [0.5, 0.5],
    [0.5, 0.5, 0.5, 0.5],
    [1.0, 0.5, 0.5],
    [0.5, 1.0, 0.5],
    [0.75, 0.25, 1.0],
    [0.5, 0.25, 0.25, 1.0],
    [1.5, 0.5],
    [0.25, 0.25, 0.5, 1.0],
    [2.0],
    [0.5, 0.5, 1.0],
    [1.0, 0.25, 0.25, 0.5],
]

def pick_note(scale, prev_note=None, leap_prob=0.3):
    """Pick a note with stepwise motion bias, occasional leaps."""
    if prev_note is None:
        return random.choice(scale)
    idx = scale.index(prev_note) if prev_note in scale else len(scale) // 2
    if random.random() < leap_prob:
        # Leap: jump 3rd to 6th
        leap = random.choice([-4, -3, -2, 2, 3, 4])
        idx = max(0, min(len(scale) - 1, idx + leap))
    else:
        # Stepwise
        step = random.choice([-1, 1])
        idx = max(0, min(len(scale) - 1, idx + step))
    return scale[idx]

beat = 0.0
prev_note = None
phrase_count = 0

while beat < BEATS:
    # Choose a rhythm pattern
    pattern = random.choice(RHYTHM_PATTERNS)
    
    # Occasionally insert a rest (silence)
    if random.random() < 0.12:
        rest_dur = random.choice([0.5, 1.0, 1.5])
        beat += rest_dur
        continue
    
    # Pick scale based on current chord
    chord_name, chord_beat = get_chord_at = None, None
    # Find current chord
    cur_beat = 0
    cur_chord = 'F7'
    for cname, cdur in PROGRESSION:
        if cur_beat <= beat < cur_beat + cdur:
            cur_chord = cname
            break
        cur_beat += cdur
    
    # Use blues scale for melody flavor
    scale = BLUES_F
    
    for dur in pattern:
        if beat >= BEATS:
            break
        note = pick_note(scale, prev_note)
        velocity = random.randint(60, 105)
        # Accent first beat of bar
        if beat % 4 < 0.01:
            velocity = min(127, velocity + 20)
        # Phrase endings: softer
        if random.random() < 0.08:
            velocity = max(40, velocity - 25)
        
        midi.addNote(0, CH_MELODY, note, beat, dur * 0.9, velocity)
        prev_note = note
        beat += dur
    
    phrase_count += 1
    # Phrase breathing: occasional short pause between phrases
    if phrase_count % random.choice([3, 4, 5]) == 0:
        beat += random.choice([0.5, 1.0])

# ── 2. Chords (comping) ───────────────────────────────────────────────────
COMPING_PATTERNS = [
    # Each pattern: list of (beat_offset, duration) within a 4-beat bar
    [(0, 1.5), (2, 1.5)],                          # half-note pairs
    [(0, 1.0), (2.5, 1.0)],                        # syncopated
    [(0, 0.5), (1.5, 0.5), (3, 0.5)],              # stabs
    [(0, 2.0), (3, 1.0)],                           # long-short
    [(0.5, 1.0), (2.5, 1.0)],                       # offbeat
    [(0, 0.75), (1.5, 0.75), (3, 0.75)],           # dotted rhythm
    [(0, 3.0), (3.5, 0.5)],                         # sustained + stab
]

cur_beat = 0.0
pat_idx = 0
for chord_name, chord_dur in PROGRESSION:
    if cur_beat >= BEATS:
        break
    voicing = CHORDS[chord_name]
    pattern = COMPING_PATTERNS[pat_idx % len(COMPING_PATTERNS)]
    pat_idx += 1
    
    for offset, dur in pattern:
        t = cur_beat + offset
        if t >= BEATS:
            break
        vel = random.randint(50, 80)
        for note in voicing:
            # Skip root occasionally for lighter voicing
            if note == voicing[0] and random.random() < 0.2:
                continue
            midi.addNote(1, CH_CHORDS, note, t, dur * 0.85, vel)
    cur_beat += chord_dur

# ── 3. Walking Bass ────────────────────────────────────────────────────────
BASS_ROOTS = {
    'F7': 41, 'Bb7': 46, 'C7': 48, 'Dm': 38,
    'Gm7': 43, 'Am': 45, 'Gm': 43,
}

cur_beat = 0.0
for chord_name, chord_dur in PROGRESSION:
    if cur_beat >= BEATS:
        break
    root = BASS_ROOTS[chord_name]
    # Walking pattern: root, approach note, chord tone, approach to next
    # Generate 4 walking notes per bar
    chord_scale = [root, root+3, root+5, root+7, root+10, root+12]
    for i in range(chord_dur):
        t = cur_beat + i
        if t >= BEATS:
            break
        if i == 0:
            note = root
        elif i == chord_dur - 1:
            # Leading tone toward next chord
            next_idx = PROGRESSION.index((chord_name, chord_dur))
            next_chord = PROGRESSION[(next_idx + 1) % len(PROGRESSION)][0]
            next_root = BASS_ROOTS[next_chord]
            note = next_root - 1  # half step below
        else:
            note = random.choice(chord_scale)
        vel = random.randint(70, 100)
        midi.addNote(2, CH_BASS, note, t, 0.9, vel)
    cur_beat += chord_dur

# ── 4. Drums (jazz brush feel) ────────────────────────────────────────────
# GM percussion: 42 = closed hi-hat, 44 = pedal hi-hat, 38 = snare,
# 33 = kick, 56 = cowbell (ride substitute), 51 = ride cymbal
RIDE = 51
HH_CLOSED = 42
HH_PEDAL = 44
SNARE = 38
KICK = 33

cur_beat = 0.0
while cur_beat < BEATS:
    bar_beat = cur_beat % 4
    
    # Ride cymbal pattern: jazz swing feel (triplet-based approximation)
    # Beats 1, 2&, 3, 4&  (using straight 8ths as approximation)
    ride_hits = [0, 1, 2, 3]  # quarter notes on ride
    for rh in ride_hits:
        t = cur_beat + rh
        if t < BEATS:
            vel = 55 if rh % 2 == 0 else 45
            midi.addNote(3, CH_DRUMS, RIDE, t, 0.5, vel)
    
    # Hi-hat on &s occasionally
    if random.random() < 0.4:
        for off in [0.5, 1.5, 2.5, 3.5]:
            t = cur_beat + off
            if t < BEATS:
                midi.addNote(3, CH_DRUMS, HH_CLOSED, t, 0.25, random.randint(30, 50))
    
    # Snare: ghost notes on beats 2 and 4, occasional accents
    for sn_beat in [1, 3]:
        t = cur_beat + sn_beat
        if t < BEATS:
            vel = random.randint(40, 65)
            if random.random() < 0.2:
                vel = random.randint(75, 100)  # accent
            midi.addNote(3, CH_DRUMS, SNARE, t, 0.3, vel)
    
    # Ghost snare notes (quiet)
    for gb in [0.5, 1.5, 2.5, 3.5]:
        if random.random() < 0.3:
            t = cur_beat + gb
            if t < BEATS:
                midi.addNote(3, CH_DRUMS, SNARE, t, 0.2, random.randint(25, 40))
    
    # Kick on beat 1 and occasionally beat 3
    for kb in [0]:
        t = cur_beat + kb
        if t < BEATS:
            midi.addNote(3, CH_DRUMS, KICK, t, 0.4, random.randint(60, 85))
    if random.random() < 0.35:
        t = cur_beat + 2
        if t < BEATS:
            midi.addNote(3, CH_DRUMS, KICK, t, 0.4, random.randint(50, 75))
    
    cur_beat += 4  # next bar

# ── Write file ─────────────────────────────────────────────────────────────
with open("music.mid", "wb") as f:
    midi.writeFile(f)

print(f"✅ music.mid written — {BEATS} beats at {BPM} BPM ≈ {DURATION_SECONDS}s")
