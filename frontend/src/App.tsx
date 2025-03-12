import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import UpdateProfile from "./components/UpdateProfile";
import AddProfile from "./components/AddProfile";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/update-profile" element={<UpdateProfile />}/>
        <Route path="/add-profile" element={<AddProfile />}/>
      </Routes>
    </Router>
  );
};

export default App;