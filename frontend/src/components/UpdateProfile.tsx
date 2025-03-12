import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UpdateProfile: React.FC = () => {
  const navigate = useNavigate();

  // Initialize form data with empty values
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchUserData = async () => {
      const response = await fetch("http://localhost:5000/dashboard", {
        credentials: "include",
      });
      const data = await response.json();
      if (!data.success) {
        navigate("/"); // Redirect if user is not logged in or session expired
      } else {
        const user = data.user;
        // Dynamically populate formData with user data
        const fields = Object.keys(user); // Get all field names from user object
        let updatedFormData: any = {};
        fields.forEach((field) => {
          // Add fields only if they have a value
          if (user[field]) {
            updatedFormData[field] = user[field];
          }
        });
        setFormData(updatedFormData);
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData: any) => ({ ...prevData, [name]: value }));
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
      const logoutResponse = await fetch("http://localhost:5000/logout", {
        method: "POST",
        credentials: "include",
      });
      const logoutData = await logoutResponse.json();
      if (logoutData.success) {
        navigate("/"); // Redirect to home or login page after successful update and logout
      }
    } else {
      setError(data.message); // Set error message from response
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">
          Update Profile
        </h2>

        {error && <p className="text-red-500 text-center mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {Object.keys(formData).map((key) => (
            key !== "username" && key !== "password" && (
              <div key={key} className="flex flex-col">
                <label className="text-gray-700 capitalize">{key}:</label>
                <input
                  type="text"
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  className="border rounded-lg px-3 py-2"
                />
              </div>
            )
          ))}
          
          {/* Fields for changing username and password */}
          <div className="flex flex-col">
            <label className="text-gray-700">New Username:</label>
            <input
              type="text"
              name="newUsername"
              value={formData.newUsername || ""}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-gray-700">Old Password:</label>
            <input
              type="password"
              name="oldPassword"
              value={formData.oldPassword || ""}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-gray-700">New Password:</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword || ""}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2"
            />
          </div>

          {/* Buttons Container */}
          <div className="mt-4 flex flex-col space-y-3">
            <button
              type="submit"
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Update
            </button>

            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProfile;
