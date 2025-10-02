# SonarQube Coverage Rollup 📈

- 🗂️ Files analysed: **2**
- 🔢 Total uncovered lines: **92**
- 🔁 Total uncovered blocks: **49**
- 🏷️ Projects: `praktika_ai_flutter`

## File Overview
| File | Project | Blocks | Lines |
| :---- | :------ | ----: | ----: |
| lib/services/audio/SoundRecorder.dart | praktika_ai_flutter | 33 | 63 |
| lib/services/audio/AudioSettings.dart | praktika_ai_flutter | 16 | 29 |

## Detailed Reports

## 📄 lib/services/audio/SoundRecorder.dart

- **Project**: praktika_ai_flutter
- **File**: `lib/services/audio/SoundRecorder.dart`
- **Generated**: 10/2/2025, 11:12:13 PM
- **SonarQube page**: https://sonarqube.ops.app.praktika.ai/component_measures?id=Praktika-ai_praktika_ai_flutter_AZFu4DzCGe8rI-Wgisw6&metric=new_coverage&pullRequest=1632&view=list&selected=Praktika-ai_praktika_ai_flutter_AZFu4DzCGe8rI-Wgisw6%3Alib%2Fservices%2Faudio%2FSoundRecorder.dart

### Quick Snapshot 📊
- 🔢 Uncovered new-code lines: **63**
- 🔁 Blocks captured: **33**
- 🧵 Longest block: lines 248-256 (9 lines)
- 🔥 Hotspot groups: **11**

#### Range Overview 🗂️
| Range | Lines | Highlight |
| :---- | ----: | :-------- |
| lines 28-30 | 3 | bool get isStarting => this == starting; |
| lines 62-63 | 2 | loggy.info('[AudioSession] Interruption event: ${event.type.name}. Begin: ${event.begin}'); |
| lines 67-68 | 2 | loggy.info( |
| line 70 | 1 | await AudioSettings.configureRecorder(isForced: true, selectBluetoothInput: true); |
| line 88 | 1 | loggy.info('[SoundRecorder] Recorder initializing started'); |
| lines 90-91 | 2 | status.value = RecorderStatus.starting; |
| line 93 | 1 | _voiceFilePath = null; |
| line 96 | 1 | final isGranted = await _recorder.hasPermission(); |
| lines 98-100 | 3 | status.value = RecorderStatus.initial; |
| line 102 | 1 | loggy.info('[SoundRecorder] Permission is granted'); |
| lines 106-110 | 5 | _stateStreamSubscription = _recorder.onStateChanged().listen((state) { |
| line 114 | 1 | loggy.info('[SoundRecorder] shouldConfigureAudioSettings: $shouldConfigureAudioSettings'); |
| lines 116-118 | 3 | loggy.info('[SoundRecorder] Calling AudioSettings.configureRecorder()'); |
| lines 121-122 | 2 | final results = await Future.wait([ |
| line 134 | 1 | _createVoiceFile().then((sink) => _voiceFileSink = sink), |
| line 137 | 1 | final stream = results.first as Stream<Uint8List>; |
| line 139 | 1 | await _recordCompleter?.future; |
| lines 141-143 | 3 | if (status.value != RecorderStatus.starting) { |
| line 146 | 1 | status.value = RecorderStatus.recording; |
| lines 148-149 | 2 | _dataSubscription = stream.listen((data) { |
| lines 152-153 | 2 | loggy.info('[SoundRecorder] Recorder start completed'); |
| lines 155-157 | 3 | status.value = RecorderStatus.initial; |
| line 162 | 1 | return Result.error(StartRecorderError()); |
| lines 164-165 | 2 | if (_recordCompleter != null && !(_recordCompleter?.isCompleted ?? false)) { |
| line 184 | 1 | status.value = RecorderStatus.stopping; |
| line 187 | 1 | await _stopRecorder(); |
| line 189 | 1 | return _voiceFilePath; |
| line 191 | 1 | loggy.error( |
| lines 198-199 | 2 | await _cancelRecorderStreams(); |
| line 224 | 1 | loggy.error( |
| lines 248-256 | 9 | Future<IOSink> _createVoiceFile() async { |
| line 271 | 1 | loggy.error( |
| line 311 | 1 | loggy.error( |

#### Notable Statements 📌
- 📌 lines 28-30 – bool get isStarting => this == starting;
- 📌 lines 62-63 – loggy.info('[AudioSession] Interruption event: ${event.type.name}. Begin: ${event.begin}');
- 📌 lines 67-68 – loggy.info(
- 📌 line 70 – await AudioSettings.configureRecorder(isForced: true, selectBluetoothInput: true);
- 📌 line 88 – loggy.info('[SoundRecorder] Recorder initializing started');
- 📌 lines 90-91 – status.value = RecorderStatus.starting;
- 📌 line 93 – _voiceFilePath = null;
- 📌 line 96 – final isGranted = await _recorder.hasPermission();
- 📌 lines 98-100 – status.value = RecorderStatus.initial;
- 📌 line 102 – loggy.info('[SoundRecorder] Permission is granted');
- 📌 lines 106-110 – _stateStreamSubscription = _recorder.onStateChanged().listen((state) {
- 📌 line 114 – loggy.info('[SoundRecorder] shouldConfigureAudioSettings: $shouldConfigureAudioSettings');
- 📌 lines 116-118 – loggy.info('[SoundRecorder] Calling AudioSettings.configureRecorder()');
- 📌 lines 121-122 – final results = await Future.wait([
- 📌 line 134 – _createVoiceFile().then((sink) => _voiceFileSink = sink),
- 📌 line 137 – final stream = results.first as Stream<Uint8List>;
- 📌 line 139 – await _recordCompleter?.future;
- 📌 lines 141-143 – if (status.value != RecorderStatus.starting) {
- 📌 line 146 – status.value = RecorderStatus.recording;
- 📌 lines 148-149 – _dataSubscription = stream.listen((data) {
- 📌 lines 152-153 – loggy.info('[SoundRecorder] Recorder start completed');
- 📌 lines 155-157 – status.value = RecorderStatus.initial;
- 📌 line 162 – return Result.error(StartRecorderError());
- 📌 lines 164-165 – if (_recordCompleter != null && !(_recordCompleter?.isCompleted ?? false)) {
- 📌 line 184 – status.value = RecorderStatus.stopping;
- 📌 line 187 – await _stopRecorder();
- 📌 line 189 – return _voiceFilePath;
- 📌 line 191 – loggy.error(
- 📌 lines 198-199 – await _cancelRecorderStreams();
- 📌 line 224 – loggy.error(
- 📌 lines 248-256 – Future<IOSink> _createVoiceFile() async {
- 📌 line 271 – loggy.error(
- 📌 line 311 – loggy.error(

### Coverage Hotspots 🔥
- 🔥 lines 28-30 · 1 block(s), 3 lines – bool get isStarting => this == starting;
- 🔥 lines 62-70 · 3 block(s), 5 lines – loggy.info('[AudioSession] Interruption event: ${event.type.name}. Begin: ${event.begin}'); … await AudioSettings.configureRecorder(isForced: true, selectBluetoothInput: true);
- 🔥 lines 88-122 · 10 block(s), 20 lines – loggy.info('[SoundRecorder] Recorder initializing started'); … final results = await Future.wait([
- 🔥 lines 134-157 · 8 block(s), 14 lines – _createVoiceFile().then((sink) => _voiceFileSink = sink), … status.value = RecorderStatus.initial;
- 🔥 lines 162-165 · 2 block(s), 3 lines – return Result.error(StartRecorderError()); … if (_recordCompleter != null && !(_recordCompleter?.isCompleted ?? false)) {
- 🔥 lines 184-191 · 4 block(s), 4 lines – status.value = RecorderStatus.stopping; … loggy.error(
- 🔥 lines 198-199 · 1 block(s), 2 lines – await _cancelRecorderStreams();
- 🔥 line 224 · 1 block(s), 1 line – loggy.error(
- 🔥 lines 248-256 · 1 block(s), 9 lines – Future<IOSink> _createVoiceFile() async {
- 🔥 line 271 · 1 block(s), 1 line – loggy.error(
- 🔥 line 311 · 1 block(s), 1 line – loggy.error(

### Code Gaps 🔍
- lines 28-30
- lines 62-63
- lines 67-68
- line 70
- line 88
- lines 90-91
- line 93
- line 96
- lines 98-100
- line 102
- lines 106-110
- line 114
- lines 116-118
- lines 121-122
- line 134
- line 137
- line 139
- lines 141-143
- line 146
- lines 148-149
- lines 152-153
- lines 155-157
- line 162
- lines 164-165
- line 184
- line 187
- line 189
- line 191
- lines 198-199
- line 224
- lines 248-256
- line 271
- line 311

#### 🔸 lines 28-30

```dart
28|   bool get isStarting => this == starting;
29|   bool get isStopping => this == stopping;
30|   bool get isCancelling => this == cancelling;
```

#### 🔸 lines 62-63

```dart
62|       loggy.info('[AudioSession] Interruption event: ${event.type.name}. Begin: ${event.begin}');
63|       AudioSettings.configureRecorder(isForced: true);
```

#### 🔸 lines 67-68

```dart
67|       loggy.info(
68|         '[AudioSession] Device Changed event. Added: ${event.devicesAdded} Removed: ${event.devicesRemoved}',
```

#### 🔸 line 70

```dart
70|       await AudioSettings.configureRecorder(isForced: true, selectBluetoothInput: true);
```

#### 🔸 line 88

```dart
88|     loggy.info('[SoundRecorder] Recorder initializing started');
```

#### 🔸 lines 90-91

```dart
90|     status.value = RecorderStatus.starting;
91|     _recordCompleter = Completer();
```

#### 🔸 line 93

```dart
93|     _voiceFilePath = null;
```

#### 🔸 line 96

```dart
96|       final isGranted = await _recorder.hasPermission();
```

#### 🔸 lines 98-100

```dart
 98|         status.value = RecorderStatus.initial;
 99|         loggy.warning('[SoundRecorder] Permission is not granted', stacktrace: StackTrace.current);
100|         return Result.error(NoMicPermissionError());
```

#### 🔸 line 102

```dart
102|         loggy.info('[SoundRecorder] Permission is granted');
```

#### 🔸 lines 106-110

```dart
106|       _stateStreamSubscription = _recorder.onStateChanged().listen((state) {
107|         if (state == RecordState.record) {
108|           loggy.info('[SoundRecorder] Recording started');
109|           _recordCompleter?.complete();
110|           _cancelStateSubscription();
```

#### 🔸 line 114

```dart
114|       loggy.info('[SoundRecorder] shouldConfigureAudioSettings: $shouldConfigureAudioSettings');
```

#### 🔸 lines 116-118

```dart
116|         loggy.info('[SoundRecorder] Calling AudioSettings.configureRecorder()');
117|         await AudioSettings.configureRecorder();
118|         loggy.info('[SoundRecorder] AudioSettings.configureRecorder() completed');
```

#### 🔸 lines 121-122

```dart
121|       final results = await Future.wait([
122|         _recorder.startStream(
```

#### 🔸 line 134

```dart
134|         _createVoiceFile().then((sink) => _voiceFileSink = sink),
```

#### 🔸 line 137

```dart
137|       final stream = results.first as Stream<Uint8List>;
```

#### 🔸 line 139

```dart
139|       await _recordCompleter?.future;
```

#### 🔸 lines 141-143

```dart
141|       if (status.value != RecorderStatus.starting) {
142|         loggy.info('[SoundRecorder] Recording started, but status is ${status.value}');
143|         return Result.error(CanceledRecorderError());
```

#### 🔸 line 146

```dart
146|       status.value = RecorderStatus.recording;
```

#### 🔸 lines 148-149

```dart
148|       _dataSubscription = stream.listen((data) {
149|         _voiceFileSink?.add(data);
```

#### 🔸 lines 152-153

```dart
152|       loggy.info('[SoundRecorder] Recorder start completed');
153|       return Result.success(stream);
```

#### 🔸 lines 155-157

```dart
155|       status.value = RecorderStatus.initial;
156|       await _cancelRecorderStreams();
157|       loggy.error(
```

#### 🔸 line 162

```dart
162|       return Result.error(StartRecorderError());
```

#### 🔸 lines 164-165

```dart
164|       if (_recordCompleter != null && !(_recordCompleter?.isCompleted ?? false)) {
165|         _recordCompleter?.completeError('Failed to start');
```

#### 🔸 line 184

```dart
184|     status.value = RecorderStatus.stopping;
```

#### 🔸 line 187

```dart
187|       await _stopRecorder();
```

#### 🔸 line 189

```dart
189|       return _voiceFilePath;
```

#### 🔸 line 191

```dart
191|       loggy.error(
```

#### 🔸 lines 198-199

```dart
198|       await _cancelRecorderStreams();
199|       status.value = RecorderStatus.initial;
```

#### 🔸 line 224

```dart
224|       loggy.error(
```

#### 🔸 lines 248-256

```dart
248|   Future<IOSink> _createVoiceFile() async {
249|     final tempDir = await getTemporaryDirectory();
250|     final fileName = const Uuid().v4() + _streamFileExt;
251|     final filepath = join(tempDir.path, _voiceFolderName, fileName);
252|     _voiceFilePath = filepath;
253|     final outputFile = File(filepath);
254|     await CommonUtils.deleteFileIfExists(filepath);
255|     await CommonUtils.createFileIfNotExists(filepath);
256|     return outputFile.openWrite();
```

#### 🔸 line 271

```dart
271|       loggy.error(
```

#### 🔸 line 311

```dart
311|       loggy.error(
```

---
### Ready-to-use Prompt 🤖
```text
You are assisting with increasing automated test coverage based on SonarQube new-code analysis.
Focus on **lib/services/audio/SoundRecorder.dart** within project **praktika_ai_flutter**.
Target the following 33 uncovered block(s):
  * lines 28-30
  * lines 62-63
  * lines 67-68
  * line 70
  * line 88
  * lines 90-91
  * line 93
  * line 96
  * lines 98-100
  * line 102
  * lines 106-110
  * line 114
  * lines 116-118
  * lines 121-122
  * line 134
  * line 137
  * line 139
  * lines 141-143
  * line 146
  * lines 148-149
  * lines 152-153
  * lines 155-157
  * line 162
  * lines 164-165
  * line 184
  * line 187
  * line 189
  * line 191
  * lines 198-199
  * line 224
  * lines 248-256
  * line 271
  * line 311
For each block, propose or implement tests that execute the code paths shown in the snippets above so SonarQube reports full coverage.
```

### Guidance & Constraints 🛠️
- Review existing automated tests and documentation for reference patterns.
- Follow the project conventions defined in `.cursorrules`.
- Keep code changes scoped to the impacted areas and their related test suites.
- Deliver concrete test updates or code snippets that measurably improve coverage.


## 📄 lib/services/audio/AudioSettings.dart

- **Project**: praktika_ai_flutter
- **File**: `lib/services/audio/AudioSettings.dart`
- **Generated**: 10/2/2025, 11:12:15 PM
- **SonarQube page**: https://sonarqube.ops.app.praktika.ai/component_measures?id=Praktika-ai_praktika_ai_flutter_AZFu4DzCGe8rI-Wgisw6&metric=new_coverage&pullRequest=1632&view=list&selected=Praktika-ai_praktika_ai_flutter_AZFu4DzCGe8rI-Wgisw6%3Alib%2Fservices%2Faudio%2FAudioSettings.dart

### Quick Snapshot 📊
- 🔢 Uncovered new-code lines: **29**
- 🔁 Blocks captured: **16**
- 🧵 Longest block: lines 145-150 (6 lines)
- 🔥 Hotspot groups: **5**

#### Range Overview 🗂️
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

#### Notable Statements 📌
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

### Coverage Hotspots 🔥
- 🔥 line 63 · 1 block(s), 1 line – factory AudioSettings._media() => AudioSettings._(
- 🔥 lines 124-165 · 11 block(s), 24 lines – final currentInput = await avSession.currentRoute.then((route) => route.inputs.firstOrNull); … loggy.info('[AudioSession] No Bluetooth input available');
- 🔥 line 199 · 1 block(s), 1 line – loggy.error('[AudioSession] Failed configuration', exception: e, stacktrace: sT);
- 🔥 line 207 · 1 block(s), 1 line – loggy.warning('[AudioSession] Failed to activate session', exception: e, stacktrace: sT);
- 🔥 lines 214-217 · 2 block(s), 2 lines – await AVAudioSession().setAllowHapticsAndSystemSoundsDuringRecording(true); … loggy.error('[AudioSession] Failed to allow haptic', exception: e, stacktrace: sT);

### Code Gaps 🔍
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

#### 🔸 line 63

```dart
63|   factory AudioSettings._media() => AudioSettings._(
```

#### 🔸 line 124

```dart
124|       final currentInput = await avSession.currentRoute.then((route) => route.inputs.firstOrNull);
```

#### 🔸 lines 126-128

```dart
126|           currentInput?.portType == AVAudioSessionPort.bluetoothHfp ||
127|           currentInput?.portType == AVAudioSessionPort.bluetoothA2dp ||
128|           currentInput?.portType == AVAudioSessionPort.bluetoothLe;
```

#### 🔸 lines 130-131

```dart
130|       loggy.info(
131|         '[AudioSession] Current input: ${currentInput?.portName} (${currentInput?.portType.name}), isBluetooth: $isCurrentInputBluetooth',
```

#### 🔸 line 135

```dart
135|         loggy.info('[AudioSession] Bluetooth input already selected, skipping');
```

#### 🔸 line 139

```dart
139|       final availableInputs = await avSession.availableInputs;
```

#### 🔸 lines 141-142

```dart
141|       loggy.info(
142|         '[AudioSession] Available inputs: ${availableInputs.map((i) => '${i.portName} (${i.portType.name})').join(', ')}',
```

#### 🔸 lines 145-150

```dart
145|       final bluetoothInput = availableInputs.cast<AVAudioSessionPortDescription?>().firstWhere(
146|         (input) =>
147|             input?.portType == AVAudioSessionPort.bluetoothHfp ||
148|             input?.portType == AVAudioSessionPort.bluetoothA2dp ||
149|             input?.portType == AVAudioSessionPort.bluetoothLe,
150|         orElse: () => null,
```

#### 🔸 lines 154-155

```dart
154|         loggy.info(
155|           '[AudioSession] Selecting Bluetooth input: ${bluetoothInput.portName} (${bluetoothInput.portType.name})',
```

#### 🔸 lines 158-161

```dart
158|         final session = await AudioSession.instance;
159|         await session.setActive(false);
160|         await avSession.setPreferredInput(bluetoothInput);
161|         await session.setActive(true);
```

#### 🔸 line 163

```dart
163|         loggy.info('[AudioSession] Bluetooth input selected and session reactivated');
```

#### 🔸 line 165

```dart
165|         loggy.info('[AudioSession] No Bluetooth input available');
```

#### 🔸 line 199

```dart
199|       loggy.error('[AudioSession] Failed configuration', exception: e, stacktrace: sT);
```

#### 🔸 line 207

```dart
207|       loggy.warning('[AudioSession] Failed to activate session', exception: e, stacktrace: sT);
```

#### 🔸 line 214

```dart
214|         await AVAudioSession().setAllowHapticsAndSystemSoundsDuringRecording(true);
```

#### 🔸 line 217

```dart
217|       loggy.error('[AudioSession] Failed to allow haptic', exception: e, stacktrace: sT);
```

---
### Ready-to-use Prompt 🤖
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
```

### Guidance & Constraints 🛠️
- Review existing automated tests and documentation for reference patterns.
- Follow the project conventions defined in `.cursorrules`.
- Keep code changes scoped to the impacted areas and their related test suites.
- Deliver concrete test updates or code snippets that measurably improve coverage.


🚀 Share this bundle with your tooling or teammates to close the coverage gaps efficiently.