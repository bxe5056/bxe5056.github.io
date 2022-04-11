import React from 'react';
import './App.css';
import { Route, Routes } from "react-router-dom";
import Home from './Home/Home';
import NavBar from './NavBar/NavBar';
import LostPage from './LostPage/LostPage';
import './importedApp.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
      return (
        <div className="App">
            <header className="App-header">
                <NavBar />
            </header>
    
            <Routes>
                <Route path="/bentheitguy">
                <Route index element={<Home />} />
                <Route path="sample" element={<NavBar />} />
                <Route path="*" element={<LostPage />} />
                </Route>
            </Routes>
        </div>
      );
  }


export default App;
