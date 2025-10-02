# SonarQube New-Code Coverage Gaps

- **Project**: praktika_ai_flutter
- **File**: `lib/services/audio/SoundRecorder.dart`
- **Generated**: 10/2/2025, 10:31:20 PM
- **SonarQube page**: https://sonarqube.ops.app.praktika.ai/component_measures?id=Praktika-ai_praktika_ai_flutter_AZFu4DzCGe8rI-Wgisw6&metric=new_coverage&pullRequest=1632&view=list&selected=Praktika-ai_praktika_ai_flutter_AZFu4DzCGe8rI-Wgisw6%3Alib%2Fservices%2Faudio%2FSoundRecorder.dart

## Quick Snapshot
- Uncovered new-code lines: **63**
- Blocks captured: **33**

### Line ranges
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

### Notable statements
- lines 28-30 - bool get isStarting => this == starting;
- lines 62-63 - loggy.info('[AudioSession] Interruption event: ${event.type.name}. Begin: ${event.begin}');
- lines 67-68 - loggy.info(
- line 70 - await AudioSettings.configureRecorder(isForced: true, selectBluetoothInput: true);
- line 88 - loggy.info('[SoundRecorder] Recorder initializing started');
- lines 90-91 - status.value = RecorderStatus.starting;
- line 93 - _voiceFilePath = null;
- line 96 - final isGranted = await _recorder.hasPermission();
- lines 98-100 - status.value = RecorderStatus.initial;
- line 102 - loggy.info('[SoundRecorder] Permission is granted');
- lines 106-110 - _stateStreamSubscription = _recorder.onStateChanged().listen((state) {
- line 114 - loggy.info('[SoundRecorder] shouldConfigureAudioSettings: $shouldConfigureAudioSettings');
- lines 116-118 - loggy.info('[SoundRecorder] Calling AudioSettings.configureRecorder()');
- lines 121-122 - final results = await Future.wait([
- line 134 - _createVoiceFile().then((sink) => _voiceFileSink = sink),
- line 137 - final stream = results.first as Stream<Uint8List>;
- line 139 - await _recordCompleter?.future;
- lines 141-143 - if (status.value != RecorderStatus.starting) {
- line 146 - status.value = RecorderStatus.recording;
- lines 148-149 - _dataSubscription = stream.listen((data) {
- lines 152-153 - loggy.info('[SoundRecorder] Recorder start completed');
- lines 155-157 - status.value = RecorderStatus.initial;
- line 162 - return Result.error(StartRecorderError());
- lines 164-165 - if (_recordCompleter != null && !(_recordCompleter?.isCompleted ?? false)) {
- line 184 - status.value = RecorderStatus.stopping;
- line 187 - await _stopRecorder();
- line 189 - return _voiceFilePath;
- line 191 - loggy.error(
- lines 198-199 - await _cancelRecorderStreams();
- line 224 - loggy.error(
- lines 248-256 - Future<IOSink> _createVoiceFile() async {
- line 271 - loggy.error(
- line 311 - loggy.error(

## Code gaps
### lines 28-30

```dart
28|   bool get isStarting => this == starting;
29|   bool get isStopping => this == stopping;
30|   bool get isCancelling => this == cancelling;
```

### lines 62-63

```dart
62|       loggy.info('[AudioSession] Interruption event: ${event.type.name}. Begin: ${event.begin}');
63|       AudioSettings.configureRecorder(isForced: true);
```

### lines 67-68

```dart
67|       loggy.info(
68|         '[AudioSession] Device Changed event. Added: ${event.devicesAdded} Removed: ${event.devicesRemoved}',
```

### line 70

```dart
70|       await AudioSettings.configureRecorder(isForced: true, selectBluetoothInput: true);
```

### line 88

```dart
88|     loggy.info('[SoundRecorder] Recorder initializing started');
```

### lines 90-91

```dart
90|     status.value = RecorderStatus.starting;
91|     _recordCompleter = Completer();
```

### line 93

```dart
93|     _voiceFilePath = null;
```

### line 96

```dart
96|       final isGranted = await _recorder.hasPermission();
```

### lines 98-100

```dart
 98|         status.value = RecorderStatus.initial;
 99|         loggy.warning('[SoundRecorder] Permission is not granted', stacktrace: StackTrace.current);
100|         return Result.error(NoMicPermissionError());
```

### line 102

```dart
102|         loggy.info('[SoundRecorder] Permission is granted');
```

### lines 106-110

```dart
106|       _stateStreamSubscription = _recorder.onStateChanged().listen((state) {
107|         if (state == RecordState.record) {
108|           loggy.info('[SoundRecorder] Recording started');
109|           _recordCompleter?.complete();
110|           _cancelStateSubscription();
```

### line 114

```dart
114|       loggy.info('[SoundRecorder] shouldConfigureAudioSettings: $shouldConfigureAudioSettings');
```

### lines 116-118

```dart
116|         loggy.info('[SoundRecorder] Calling AudioSettings.configureRecorder()');
117|         await AudioSettings.configureRecorder();
118|         loggy.info('[SoundRecorder] AudioSettings.configureRecorder() completed');
```

### lines 121-122

```dart
121|       final results = await Future.wait([
122|         _recorder.startStream(
```

### line 134

```dart
134|         _createVoiceFile().then((sink) => _voiceFileSink = sink),
```

### line 137

```dart
137|       final stream = results.first as Stream<Uint8List>;
```

### line 139

```dart
139|       await _recordCompleter?.future;
```

### lines 141-143

```dart
141|       if (status.value != RecorderStatus.starting) {
142|         loggy.info('[SoundRecorder] Recording started, but status is ${status.value}');
143|         return Result.error(CanceledRecorderError());
```

### line 146

```dart
146|       status.value = RecorderStatus.recording;
```

### lines 148-149

```dart
148|       _dataSubscription = stream.listen((data) {
149|         _voiceFileSink?.add(data);
```

### lines 152-153

```dart
152|       loggy.info('[SoundRecorder] Recorder start completed');
153|       return Result.success(stream);
```

### lines 155-157

```dart
155|       status.value = RecorderStatus.initial;
156|       await _cancelRecorderStreams();
157|       loggy.error(
```

### line 162

```dart
162|       return Result.error(StartRecorderError());
```

### lines 164-165

```dart
164|       if (_recordCompleter != null && !(_recordCompleter?.isCompleted ?? false)) {
165|         _recordCompleter?.completeError('Failed to start');
```

### line 184

```dart
184|     status.value = RecorderStatus.stopping;
```

### line 187

```dart
187|       await _stopRecorder();
```

### line 189

```dart
189|       return _voiceFilePath;
```

### line 191

```dart
191|       loggy.error(
```

### lines 198-199

```dart
198|       await _cancelRecorderStreams();
199|       status.value = RecorderStatus.initial;
```

### line 224

```dart
224|       loggy.error(
```

### lines 248-256

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

### line 271

```dart
271|       loggy.error(
```

### line 311

```dart
311|       loggy.error(
```

---
## Ready-to-use Prompt
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
Reference the SonarQube page for context: https://sonarqube.ops.app.praktika.ai/component_measures?id=Praktika-ai_praktika_ai_flutter_AZFu4DzCGe8rI-Wgisw6&metric=new_coverage&pullRequest=1632&view=list&selected=Praktika-ai_praktika_ai_flutter_AZFu4DzCGe8rI-Wgisw6%3Alib%2Fservices%2Faudio%2FSoundRecorder.dart
Limit changes to the impacted file and related test suites only.
```
