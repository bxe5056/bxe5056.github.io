import React from 'react';
import './App.css';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from './Home/Home';
import NavBar from './NavBar/NavBar';
import LostPage from './LostPage/LostPage';

const App = () => {
      return (
        <div className="App">
          <header className="App-header">
              {/* <NavBar /> */}
          </header>
    
          <BrowserRouter>
            <Routes>
              <Route path="/bentheitguy">
                <Route index element={<Home />} />
                <Route path="sample" element={<NavBar />} />
                <Route path="*" element={<LostPage />} />
              </Route>
            </Routes>
          </BrowserRouter>

        </div>
      );
  }


export default App;
