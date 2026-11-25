"use client";
import { useState } from 'react';

export default function InspectionApproval() {
  const [certId, setCertId] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3000/api/v1/environmental-certs/${certId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, inspection_notes: notes }),
      });
      
      const result = await response.json();
      if (result.success) alert('Status updated successfully!');
      else alert('Failed to update status');
    } catch (error) {
      alert('Network error connecting to API');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto mt-10 border rounded shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-red-900">Environmental Inspection Approval</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block mb-1 font-semibold">Certificate ID</label>
          <input 
            type="number" 
            className="border p-2 w-full text-black"
            value={certId} 
            onChange={(e) => setCertId(e.target.value)} 
            required 
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">Inspection Status</label>
          <select 
            className="border p-2 w-full text-black"
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-semibold">Inspection Notes</label>
          <textarea 
            className="border p-2 w-full h-32 text-black"
            value={notes} 
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded">
          Submit Inspection
        </button>
      </form>
    </div>
  );
}