/* Copyright 2013 Chris Wilson

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = new AudioContext();
var audioInput = null,
    realAudioInput = null,
    inputPoint = null,
    audioRecorder = null;
var rafID = null;
var analyserContext = null;
var canvasWidth, canvasHeight;
var recIndex = 0;
var j = null;
var websocket = null; 
var flag = false;


/* TODO:

- offer mono option
- "Monitor input" switch
*/

function saveAudio() {
    audioRecorder.exportWAV( doneEncoding );
    // could get mono instead by saying
    // audioRecorder.exportMonoWAV( doneEncoding );
}

function gotBuffers( buffers ) {

    audioRecorder.exportWAV( doneEncoding );
}

function doneEncoding( blob ) {

	var arrayBuffer;
    var fileReader = new FileReader();
    fileReader.onload = function(event) {
    arrayBuffer = event.target.result;
                         };
    fileReader.readAsArrayBuffer(blob);
	
	


websocket = new WebSocket('ws://survival-network-system.eu-gb.mybluemix.net/ws/testSocket');
websocket.onopen = function(evt) {
console.log('Audio : ');
		console.log(arrayBuffer);
		var message = {
    action: 'start',
    'content-type': 'audio/wav',
	keywords: ['report', 'disaster', 'tornado','weather','help','support','earthquake','news','food','medical','shelter'],
    'keywords_threshold': 0.5,
    
 
  };
  websocket.send(JSON.stringify(message));

  // Prepare and send the audio file.
  websocket.send(arrayBuffer);

  websocket.send(JSON.stringify({action: 'stop'}));
  
}

websocket.onclose = function(evt) { onClose(evt) };
websocket.onmessage = function(evt) { onMessage(evt) };
websocket.onerror = function(evt) { onError(evt) };
}

function onClose(evt) {
  console.log(evt.data);
}

function onMessage(evt) {
	
  console.log(evt.data);
  var textResponse = JSON.parse(evt.data);
  if(textResponse.state == null)
  {
	$("#textInput").val(textResponse.text);
	
  var e = jQuery.Event("keydown", { keyCode: 13 });
     $("#textInput").trigger(e);

  }
  
}

function onError(evt) {
  console.log(evt.data);
}



function convertToMono( input ) {
    var splitter = audioContext.createChannelSplitter(2);
    var merger = audioContext.createChannelMerger(2);

    input.connect( splitter );
    splitter.connect( merger, 0, 0 );
    splitter.connect( merger, 0, 1 );
    return merger;
}

function cancelAnalyserUpdates() {
    window.cancelAnimationFrame( rafID );
    rafID = null;
}


function toggleMono() {
    if (audioInput != realAudioInput) {
        audioInput.disconnect();
        realAudioInput.disconnect();
        audioInput = realAudioInput;
    } else {
        realAudioInput.disconnect();
        audioInput = convertToMono( realAudioInput );
    }

    audioInput.connect(inputPoint);
}

function gotStream(stream) {
    inputPoint = audioContext.createGain();

    // Create an AudioNode from the stream.
    realAudioInput = audioContext.createMediaStreamSource(stream);
    audioInput = realAudioInput;
    audioInput.connect(inputPoint);

//    audioInput = convertToMono( input );

    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    inputPoint.connect( analyserNode );

    audioRecorder = new Recorder( inputPoint );

    zeroGain = audioContext.createGain();
    zeroGain.gain.value = 0.0;
    inputPoint.connect( zeroGain );
    zeroGain.connect( audioContext.destination );
   
}

function initAudio() {
        if (!navigator.getUserMedia)
            navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        if (!navigator.cancelAnimationFrame)
            navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
        if (!navigator.requestAnimationFrame)
            navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

    navigator.getUserMedia(
        {
            "audio": {
                "mandatory": {
                    "googEchoCancellation": "false",
                    "googAutoGainControl": "false",
                    "googNoiseSuppression": "false",
                    "googHighpassFilter": "false"
                },
                "optional": []
            },
        }, gotStream, function(e) {
            alert('Error getting audio');
            console.log(e);
        });
}
function toggleRecording( e ) {
	
    if (e.classList.contains("recording")) {
        // stop recording
		
        audioRecorder.stop();
        e.classList.remove("recording");
        audioRecorder.getBuffers( gotBuffers );
    } else {
		
		if(flag == false)
		{
			initAudio();
			
			flag = true;
		}
        // start recording
        if (!audioRecorder)
            return;
	
        e.classList.add("recording");
        audioRecorder.clear();
        audioRecorder.record();
    }
}
//window.addEventListener('load', initAudio );
