import React from 'react';
import './NavBar.css';
import { Link } from "react-router-dom";

class NavBar extends React.Component {
  render() {
      return (
        <div className="NavBar">
          <li> <Link to="/">Home</Link> </li>
          <li> <Link to="/dataRepo">DataRepo</Link> </li>
          <li> <Link to="/contact">Contact</Link> </li>
        </div>
      );
  }
}

export default NavBar;
