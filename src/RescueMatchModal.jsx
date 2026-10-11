import React from 'react';

export default function RescueMatchModal({ isOpen, rescueMatch, onAccept, onDecline }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-lg text-center border-4 border-green-500 shadow-2xl">
        <div className="text-6xl mb-4">🚀</div>
        <h2 className="text-3xl font-bold text-green-600 mb-3">Rescue Match Found!</h2>
        <p className="text-gray-600 mb-6">
          Your original session was cancelled, but we found another compatible partner available right now!
        </p>

        <div className="bg-gray-100 p-5 rounded-lg mb-6">
          <p className="font-bold text-xl">{rescueMatch?.name || "Mohan D"}</p>
          <p className="text-sm text-gray-500">Teaches: {rescueMatch?.teaches || "Web Development"}</p>
          <p className="text-sm text-gray-500">Wants to Learn: {rescueMatch?.wantsToLearn || "Graphic Design"}</p>
          <p className="text-sm text-green-600 font-bold mt-2">✅ Available at the same time slot</p>
        </div>

        <div className="flex justify-center gap-4">
          <button onClick={onDecline} className="px-6 py-3 border rounded-lg hover:bg-gray-100">
            Decline
          </button>
          <button onClick={onAccept} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold">
            Accept Rescue Match
          </button>
        </div>
      </div>
    </div>
  );
}