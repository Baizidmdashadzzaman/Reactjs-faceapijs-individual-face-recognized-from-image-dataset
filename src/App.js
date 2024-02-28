import * as faceapi from 'face-api.js';
import React from 'react';

function App() {

  const [modelsLoaded, setModelsLoaded] = React.useState(false);
  const [captureVideo, setCaptureVideo] = React.useState(false);

  const videoRef = React.useRef();
  const videoHeight = 480;
  const videoWidth = 640;
  const canvasRef = React.useRef();

  React.useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + '/assests/models';

      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      ]).then(setModelsLoaded(true));
    }
    loadModels();
  }, []);

  const startVideo = () => {
    setCaptureVideo(true);
    navigator.mediaDevices
      .getUserMedia({ video: { width: 300 } })
      .then(stream => {
        let video = videoRef.current;
        video.srcObject = stream;
        video.play();
      })
      .catch(err => {
        console.error("error:", err);
      });
  }

  function getLabeledFaceDescriptions() {
    const labels = ["Asadzaman","Anshara","Baizid"];
    return Promise.all(
      labels.map(async (label) => {
        const descriptions = [];
        for (let i = 1; i <= 2; i++) {
          const img = await faceapi.fetchImage(`./assests/labels/${label}/${i}.png`);
          const detections = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();
          descriptions.push(detections.descriptor);
        }
        return new faceapi.LabeledFaceDescriptors(label, descriptions);
      })
    );
  }


  
  const [detected_person, set_detected_person] = React.useState('Not detect yet');

  async function handleVideoOnPlay(){
    if (canvasRef && canvasRef.current) {
      const displaySize = {
        width: videoWidth,
        height: videoHeight
      }
      const labeledFaceDescriptors = await getLabeledFaceDescriptions();
      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
      const canvas = faceapi.createCanvasFromMedia(videoRef.current);
      document.body.append(canvas);
    
      
      faceapi.matchDimensions(canvas, displaySize);
    
      setInterval(async () => {
        const detections = await faceapi
          .detectAllFaces(videoRef.current)
          .withFaceLandmarks()
          .withFaceDescriptors();
    
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
    
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    
        const results = resizedDetections.map((d) => {
          return faceMatcher.findBestMatch(d.descriptor);
        });
        results.forEach((result, i) => {
          console.log(result)
          set_detected_person(result._label);
        });
      }, 100);
    }
  };


  const closeWebcam = () => {
    videoRef.current.pause();
    videoRef.current.srcObject.getTracks()[0].stop();
    setCaptureVideo(false);
  }

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '10px' }}>
        {
          captureVideo && modelsLoaded ?
          <>
            {/* <button onClick={closeWebcam} style={{ cursor: 'pointer', backgroundColor: 'green', color: 'white', padding: '15px', fontSize: '25px', border: 'none', borderRadius: '10px' }}>
              Close Webcam
            </button> */}
            
            <a href='' style={{ cursor: 'pointer', backgroundColor: 'green', color: 'white', padding: '15px', fontSize: '25px', border: 'none', borderRadius: '10px' }}>
              Close Webcam
            </a>
          </>
            :
            <button onClick={startVideo} style={{ cursor: 'pointer', backgroundColor: 'green', color: 'white', padding: '15px', fontSize: '25px', border: 'none', borderRadius: '10px' }}>
              Open Webcam
            </button>
        }
      </div>
      {
        captureVideo ?
          modelsLoaded ?
            <div>
              <center>
              <div style={{padding: '10px' }}>
                <h2>Your name is :{detected_person}</h2>
                <br/><br/>
                <video ref={videoRef} height={videoHeight} width={videoWidth} onPlay={handleVideoOnPlay} style={{ borderRadius: '10px' }} />
                <canvas ref={canvasRef} style={{ position: 'absolute' }} />
              </div>
              </center>
            </div>
            :
            <div>loading...</div>
          :
          <>
          </>
      }
    </div>
  );
}

export default App;