import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface User {
  [key: string]: string; // Allows dynamic fields like real name, phone number, etc.
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("http://localhost:5000/dashboard", {
          credentials: "include",
        });
        const data = await response.json();
        if (data.success) setUser(data.user);
        else navigate("/");
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUser();
  }, [navigate]);

  // Handle checkbox selection
  const handleCheckboxChange = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  // Send selected user info
  const handleSubmit = async () => {
    if (!user) return;

    const selectedData: Partial<User> = {};
    selectedFields.forEach((field) => {
      selectedData[field] = user[field];
    });

    try {
      const response = await fetch("https://external-api.com/receive-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedData),
      });

      const data = await response.json();
      alert(`Response: ${data.message}`);
    } catch (error) {
      console.error("Error sending data:", error);
      alert("Failed to send data.");
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:5000/logout", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();
      if (data.success) {
        navigate("/");
      } else {
        alert("Logout failed, please try again.");
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">
          Dashboard
        </h2>

        {user ? (
          <>
            <p className="text-gray-700 text-center mb-2">
              Welcome, <span className="font-bold">{user.username}</span>!
            </p>

            {/* Display only fields with values */}
            <div className="space-y-3">
              {Object.entries(user)
                .filter(([_, value]) => value) // Show only non-empty fields
                .map(([field, value]) => (
                  <label
                    key={field}
                    className="flex items-center space-x-2 bg-gray-100 p-2 rounded-lg cursor-pointer hover:bg-gray-200 transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field)}
                      onChange={() => handleCheckboxChange(field)}
                      className="w-5 h-5 text-blue-500"
                    />
                    <span className="text-gray-700">
                      {field}: {value}
                    </span>
                  </label>
                ))}
            </div>

            {/* Buttons Container */}
            <div className="mt-4 flex flex-col space-y-3">
              {/* Send Data Button */}
              <button
                onClick={handleSubmit}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                Send Selected Data
              </button>

              {/* Navigate to Update Profile Page */}
              <button
                onClick={() => navigate("/update-profile")}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
              >
                Update Profile
              </button>

              {/* Navigate to Add Profile Page */}
              <button
                onClick={() => navigate("/add-profile")}
                className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
              >
                Add Profile Info
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-600 text-center">Loading...</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;