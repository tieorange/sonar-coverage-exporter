# SonarQube Coverage Gaps 📉

- **Project**: praktika_ai_flutter
- **File**: `lib/services/audio/AudioSettings.dart`
- **Generated**: 10/2/2025, 10:42:50 PM
- **SonarQube page**: https://sonarqube.ops.app.praktika.ai/component_measures?id=Praktika-ai_praktika_ai_flutter_AZFu4DzCGe8rI-Wgisw6&metric=new_coverage&pullRequest=1632&view=list&selected=Praktika-ai_praktika_ai_flutter_AZFu4DzCGe8rI-Wgisw6%3Alib%2Fservices%2Faudio%2FAudioSettings.dart

## Quick Snapshot 📊
- 🔢 Uncovered new-code lines: **29**
- 🔁 Blocks captured: **16**

### Range Overview 🗂️
| Range | Lines | Highlight |
| :---- | ----: | :-------- |
| line 63 | 1 | factory AudioSettings._media() => AudioSettings._( |
| line 124 | 1 | final currentInput = await avSession.currentRoute.then((route) => route.inputs.firstOrNull); |
| lines 126-128 | 3 | currentInput?.portType == AVAudioSessionPort.bluetoothHfp \|\| |
| lines 130-131 | 2 | loggy.info( |
| line 135 | 1 | loggy.info('[AudioSession] Bluetooth input already selected, skipping'); |
| line 139 | 1 | final availableInputs = await avSession.availableInputs; |
| lines 141-142 | 2 | loggy.info( |
| lines 145-150 | 6 | final bluetoothInput = availableInputs.cast<AVAudioSessionPortDescription?>().firstWhere( |
| lines 154-155 | 2 | loggy.info( |
| lines 158-161 | 4 | final session = await AudioSession.instance; |
| line 163 | 1 | loggy.info('[AudioSession] Bluetooth input selected and session reactivated'); |
| line 165 | 1 | loggy.info('[AudioSession] No Bluetooth input available'); |
| line 199 | 1 | loggy.error('[AudioSession] Failed configuration', exception: e, stacktrace: sT); |
| line 207 | 1 | loggy.warning('[AudioSession] Failed to activate session', exception: e, stacktrace: sT); |
| line 214 | 1 | await AVAudioSession().setAllowHapticsAndSystemSoundsDuringRecording(true); |
| line 217 | 1 | loggy.error('[AudioSession] Failed to allow haptic', exception: e, stacktrace: sT); |

### Notable Statements 📌
- 📌 line 63 – factory AudioSettings._media() => AudioSettings._(
- 📌 line 124 – final currentInput = await avSession.currentRoute.then((route) => route.inputs.firstOrNull);
- 📌 lines 126-128 – currentInput?.portType == AVAudioSessionPort.bluetoothHfp ||
- 📌 lines 130-131 – loggy.info(
- 📌 line 135 – loggy.info('[AudioSession] Bluetooth input already selected, skipping');
- 📌 line 139 – final availableInputs = await avSession.availableInputs;
- 📌 lines 141-142 – loggy.info(
- 📌 lines 145-150 – final bluetoothInput = availableInputs.cast<AVAudioSessionPortDescription?>().firstWhere(
- 📌 lines 154-155 – loggy.info(
- 📌 lines 158-161 – final session = await AudioSession.instance;
- 📌 line 163 – loggy.info('[AudioSession] Bluetooth input selected and session reactivated');
- 📌 line 165 – loggy.info('[AudioSession] No Bluetooth input available');
- 📌 line 199 – loggy.error('[AudioSession] Failed configuration', exception: e, stacktrace: sT);
- 📌 line 207 – loggy.warning('[AudioSession] Failed to activate session', exception: e, stacktrace: sT);
- 📌 line 214 – await AVAudioSession().setAllowHapticsAndSystemSoundsDuringRecording(true);
- 📌 line 217 – loggy.error('[AudioSession] Failed to allow haptic', exception: e, stacktrace: sT);

## Code Gaps 🔍
- line 63
- line 124
- lines 126-128
- lines 130-131
- line 135
- line 139
- lines 141-142
- lines 145-150
- lines 154-155
- lines 158-161
- line 163
- line 165
- line 199
- line 207
- line 214
- line 217

### 🔸 line 63

```dart
63|   factory AudioSettings._media() => AudioSettings._(
```

### 🔸 line 124

```dart
124|       final currentInput = await avSession.currentRoute.then((route) => route.inputs.firstOrNull);
```

### 🔸 lines 126-128

```dart
126|           currentInput?.portType == AVAudioSessionPort.bluetoothHfp ||
127|           currentInput?.portType == AVAudioSessionPort.bluetoothA2dp ||
128|           currentInput?.portType == AVAudioSessionPort.bluetoothLe;
```

### 🔸 lines 130-131

```dart
130|       loggy.info(
131|         '[AudioSession] Current input: ${currentInput?.portName} (${currentInput?.portType.name}), isBluetooth: $isCurrentInputBluetooth',
```

### 🔸 line 135

```dart
135|         loggy.info('[AudioSession] Bluetooth input already selected, skipping');
```

### 🔸 line 139

```dart
139|       final availableInputs = await avSession.availableInputs;
```

### 🔸 lines 141-142

```dart
141|       loggy.info(
142|         '[AudioSession] Available inputs: ${availableInputs.map((i) => '${i.portName} (${i.portType.name})').join(', ')}',
```

### 🔸 lines 145-150

```dart
145|       final bluetoothInput = availableInputs.cast<AVAudioSessionPortDescription?>().firstWhere(
146|         (input) =>
147|             input?.portType == AVAudioSessionPort.bluetoothHfp ||
148|             input?.portType == AVAudioSessionPort.bluetoothA2dp ||
149|             input?.portType == AVAudioSessionPort.bluetoothLe,
150|         orElse: () => null,
```

### 🔸 lines 154-155

```dart
154|         loggy.info(
155|           '[AudioSession] Selecting Bluetooth input: ${bluetoothInput.portName} (${bluetoothInput.portType.name})',
```

### 🔸 lines 158-161

```dart
158|         final session = await AudioSession.instance;
159|         await session.setActive(false);
160|         await avSession.setPreferredInput(bluetoothInput);
161|         await session.setActive(true);
```

### 🔸 line 163

```dart
163|         loggy.info('[AudioSession] Bluetooth input selected and session reactivated');
```

### 🔸 line 165

```dart
165|         loggy.info('[AudioSession] No Bluetooth input available');
```

### 🔸 line 199

```dart
199|       loggy.error('[AudioSession] Failed configuration', exception: e, stacktrace: sT);
```

### 🔸 line 207

```dart
207|       loggy.warning('[AudioSession] Failed to activate session', exception: e, stacktrace: sT);
```

### 🔸 line 214

```dart
214|         await AVAudioSession().setAllowHapticsAndSystemSoundsDuringRecording(true);
```

### 🔸 line 217

```dart
217|       loggy.error('[AudioSession] Failed to allow haptic', exception: e, stacktrace: sT);
```

---
## Ready-to-use Prompt 🤖
```text
You are assisting with increasing automated test coverage based on SonarQube new-code analysis.
Focus on **lib/services/audio/AudioSettings.dart** within project **praktika_ai_flutter**.
Target the following 16 uncovered block(s):
  * line 63
  * line 124
  * lines 126-128
  * lines 130-131
  * line 135
  * line 139
  * lines 141-142
  * lines 145-150
  * lines 154-155
  * lines 158-161
  * line 163
  * line 165
  * line 199
  * line 207
  * line 214
  * line 217
For each block, propose or implement tests that execute the code paths shown in the snippets above so SonarQube reports full coverage.
Reference the SonarQube page for context: https://sonarqube.ops.app.praktika.ai/component_measures?id=Praktika-ai_praktika_ai_flutter_AZFu4DzCGe8rI-Wgisw6&metric=new_coverage&pullRequest=1632&view=list&selected=Praktika-ai_praktika_ai_flutter_AZFu4DzCGe8rI-Wgisw6%3Alib%2Fservices%2Faudio%2FAudioSettings.dart
Follow tests examples in our codebase and /docs/ folder and follow rules in the .cursorrules file.
Limit changes to the impacted file and related test suites only.
Return actionable test updates or code snippets that raise coverage for the listed ranges.
```

🚀 Share this report with your tooling or teammates to close the coverage gaps efficiently.