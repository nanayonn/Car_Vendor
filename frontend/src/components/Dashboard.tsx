import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface User {
  username: string;
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const response = await fetch("http://localhost:5000/dashboard", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) setUser(data.user);
      else navigate("/");
    };
    fetchUser();
  }, [navigate]);

  return (
    <div>
      <h2>Dashboard</h2>
      {user ? (
        <>
          <p>Welcome, {user.username}!</p>
          <button onClick={() => navigate("/update-profile")}>
            Update Profile
          </button>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Dashboard;