import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UpdateProfile: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    address: "",
    province: "",
    newUsername: "",
    newPassword: "",
    oldPassword: "",
  });
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchUserData = async () => {
      const response = await fetch("http://localhost:5000/dashboard", {
        credentials: "include",
      });
      const data = await response.json();
      if (!data.success) {
        navigate("/");
      } else {
        // Prefill the form with the existing data, except for the password
        const { email, address, province, username } = data.user;
        setFormData({
          email,
          address: address || "",
          province: province || "",
          newUsername: username,
          newPassword: "",
          oldPassword: "",
        });
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch("http://localhost:5000/update-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
      credentials: "include",
    });
    const data = await response.json();
    if (data.success) {
      navigate("/dashboard");
    } else {
      setError(data.message);
    }
  };

  return (
    <div>
      <h2>Update Profile</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Address:</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Province:</label>
          <input
            type="text"
            name="province"
            value={formData.province}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>New Username:</label>
          <input
            type="text"
            name="newUsername"
            value={formData.newUsername}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Old Password:</label>
          <input
            type="password"
            name="oldPassword"
            value={formData.oldPassword}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>New Password:</label>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
          />
        </div>
        <button type="submit">Update</button>
      </form>
    </div>
  );
};

export default UpdateProfile;
