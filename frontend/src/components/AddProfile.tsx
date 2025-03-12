import React, { useEffect, useState } from "react";

const AddProfile: React.FC = () => {
  const [availableFields, setAvailableFields] = useState<string[]>([]); // Holds available fields
  const [selectedField, setSelectedField] = useState<string | "">(""); // Holds the selected field
  const [value, setValue] = useState<string>(""); // Holds the input value for the selected field

  useEffect(() => {
    // Fetch available fields from the backend
    const fetchFields = async () => {
      const response = await fetch("http://localhost:5000/available-profile-fields", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) setAvailableFields(data.availableFields); // Set the available fields
    };

    fetchFields();
  }, []);

  // Handle field selection change
  const handleFieldChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedField(event.target.value);
  };

  // Handle value input change
  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedField || !value) {
      alert("Please select a field and provide a value.");
      return;
    }

    const profileData = { [selectedField]: value }; // Collect the selected field and its value

    const response = await fetch("http://localhost:5000/add-profile", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ additionalFields: profileData }),
    });

    const data = await response.json();
    if (data.success) {
      alert("Profile updated successfully!");
      window.location.reload(); // Reload the page after success
    } else {
      alert("Error updating profile.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-4">Add Profile Field</h2>

        {/* Dropdown for selecting the missing profile field */}
        {availableFields.length > 0 ? (
          <>
            <select
              value={selectedField}
              onChange={handleFieldChange}
              className="p-2 border rounded w-full mb-3"
            >
              <option value="">Select Field</option>
              {availableFields.map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>

            {/* Input field for the selected field */}
            <input
              type="text"
              value={value}
              onChange={handleValueChange}
              className="p-2 border rounded w-full"
              placeholder="Enter Value"
            />

            {/* Submit button to save the profile */}
            <button
              onClick={handleSubmit}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition mt-4"
            >
              Update Profile
            </button>
          </>
        ) : (
          <p className="text-gray-600 text-center">No fields to update</p>
        )}
      </div>
    </div>
  );
};

export default AddProfile;
