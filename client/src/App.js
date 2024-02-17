import './App.css';
import {BrowserRouter as Router,Routes, Route} from 'react-router-dom';
import FileList from './Pages/FileList';
import UploadVideo from './Pages/UploadVideo';
function App() {

  
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<UploadVideo />} />
          <Route path="/published" element={<FileList />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
