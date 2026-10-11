import { useState } from 'react';
import RescueMatchModal from './RescueMatchModal';
import CancelModal from './CancelModal';

function App() {
  const [showCancel, setShowCancel] = useState(false);
  const [showRescue, setShowRescue] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // When user confirms cancellation, show the Rescue Match popup
  const handleConfirmCancel = (reason) => {
    setCancelReason(reason);
    setShowCancel(false);
    setShowRescue(true); // Trigger the Rescue Match!
  };

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Jaswith's Test UI</h1>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-2">Test 1: Rescue Match Popup</p>
        <button 
          onClick={() => setShowRescue(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Test Rescue Match
        </button>
      </div>

      <div className="mb-6">
        <p className="text-gray-600 mb-2">Test 2: Cancel Session Flow</p>
        <button 
          onClick={() => setShowCancel(true)}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Test Cancel Session
        </button>
      </div>

      {cancelReason && (
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            Last cancellation reason: <strong>{cancelReason}</strong>
          </p>
        </div>
      )}

      {/* Cancel Modal */}
      <CancelModal 
        isOpen={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirmCancel={handleConfirmCancel}
      />

      {/* Rescue Match Modal */}
      <RescueMatchModal 
        isOpen={showRescue}
        rescueMatch={{ name: "Mohan D", teaches: "Web Dev", wantsToLearn: "Design" }}
        onAccept={() => { alert("✅ Rescue Match Accepted!"); setShowRescue(false); }}
        onDecline={() => setShowRescue(false)}
      />
    </div>
  );
}

export default App;