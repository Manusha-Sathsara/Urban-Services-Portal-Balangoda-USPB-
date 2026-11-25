"use client";
import { useEffect, useState } from 'react';

export default function PrintEngine() {
  const [certs, setCerts] = useState<any[]>([]);

  useEffect(() => {
    // Fetch only the APPROVED certificates from your Go backend
    fetch('http://localhost:3000/api/v1/environmental-certs/approved')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setCerts(data.data);
        }
      })
      .catch(err => console.error("Error fetching approved certs:", err));
  }, []);

  return (
    <div className="min-h-screen bg-[#faf4f3] p-8 print:p-0 print:bg-white">
      
      {/* Control Panel (Hidden during printing) */}
      <div className="mb-6 flex max-w-4xl mx-auto items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-[#800000]">Gazette Print Engine</h1>
          <p className="text-sm text-gray-600">Ensure official Gazette paper is loaded in the printer.</p>
        </div>
        <button 
          onClick={() => window.print()} 
          className="rounded bg-[#800000] px-6 py-2 font-bold text-white shadow hover:bg-[#5a0000]"
        >
          Print All Approved
        </button>
      </div>

      {certs.length === 0 ? (
        <div className="max-w-4xl mx-auto rounded border bg-white p-8 text-center print:hidden">
          <p className="text-gray-500">No approved certificates found in the print queue.</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {certs.map((cert) => (
            /* A4 Size Canvas: 210mm x 297mm */
            <div 
              key={cert.id} 
              className="relative mx-auto mb-8 h-[297mm] w-[210mm] overflow-hidden border border-gray-300 bg-white shadow-lg print:m-0 print:mb-0 print:border-none print:shadow-none print:break-after-page"
            >
              <style jsx>{`
                @media print {
                  @page { size: A4 portrait; margin: 0; }
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
              `}</style>
              
              {/* X/Y Calibration using absolute positioning */}
              {/* Certificate ID */}
              <div className="absolute left-[165mm] top-[45mm] font-mono text-sm text-black">
                CERT-{cert.id}
              </div>

              {/* Business Name */}
              <div className="absolute left-[50mm] top-[85mm] font-serif text-lg font-bold text-black uppercase">
                {cert.business_name || "BUSINESS NAME NOT SET"}
              </div>

              {/* Owner Name */}
              <div className="absolute left-[50mm] top-[105mm] font-serif text-lg text-black">
                {cert.owner_name || "OWNER NOT SET"}
              </div>

              {/* Inspection Date / Approval Date */}
              <div className="absolute left-[130mm] top-[215mm] font-serif text-base text-black">
                {cert.inspection_date ? cert.inspection_date.split('T')[0] : "N/A"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}