import React, { useState } from 'react';

export default function CancelModal({ isOpen, onClose, onConfirmCancel }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError("⚠️ A valid reason is mandatory to cancel a session.");
      return;
    }
    onConfirmCancel(reason);
    setReason('');
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-red-600">⚠️ Cancel Session</h2>
        <p className="text-sm text-gray-600 mb-4">
          Cancellations must be made 15-30 minutes before the session. Please provide a valid reason.
        </p>
        
        <textarea 
          className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          rows="3"
          placeholder="Type your reason here..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">
            Go Back
          </button>
          <button 
            onClick={handleSubmit} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Confirm Cancel
          </button>
        </div>
      </div>
    </div>
  );
}