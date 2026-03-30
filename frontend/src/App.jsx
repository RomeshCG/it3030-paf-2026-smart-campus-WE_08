import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ResourceList } from './components/ResourceList';
import { ResourceDetails } from './components/ResourceDetails';
import { Toaster } from 'react-hot-toast';
import './index.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            },
            success: {
              iconTheme: {
                primary: 'var(--success)',
                secondary: 'white',
              },
            },
            error: {
              iconTheme: {
                primary: 'var(--danger)',
                secondary: 'white',
              },
            },
          }} 
        />
        <main>
          <Routes>
            <Route path="/" element={<ResourceList />} />
            <Route path="/resources/:id" element={<ResourceDetails />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
