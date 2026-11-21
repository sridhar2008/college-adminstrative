import React, { useRef } from 'react';
import { Download, Printer, ShieldCheck, QrCode, Phone, Mail, Droplets, Calendar, MapPin, Building, GraduationCap, X } from 'lucide-react';

export default function StudentIdCardModal({ idCardData, onClose, onUploadPhoto }) {
  const cardRef = useRef(null);

  if (!idCardData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (onUploadPhoto) {
          onUploadPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      {/* Dialog Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative print:border-none print:shadow-none print:p-0 print:bg-white text-slate-100 print:text-black">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-cyan-400 flex items-center justify-center border border-blue-500/30">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Institutional Identity Card (Smart ID)</h3>
              <p className="text-xs text-slate-400">Official accredited college identity credential with printable badge & barcode</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="cursor-pointer inline-flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold rounded-xl border border-cyan-500/30 transition">
              <span>Change / Upload Photo</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Section: FRONT AND BACK CARDS */}
        <div ref={cardRef} className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center py-2">
          
          {/* ===================== FRONT OF ID CARD ===================== */}
          <div className="w-[340px] h-[520px] bg-gradient-to-b from-slate-900 via-slate-950 to-blue-950 border-2 border-cyan-500/40 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col justify-between text-white p-5 print:border-2 print:border-black print:text-black print:bg-white">
            
            {/* Top Lanyard Punch Hole Decoration */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-2.5 rounded-full bg-slate-800 border border-slate-700 print:border-black"></div>

            {/* Institution Brand Header */}
            <div className="text-center pt-2">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-700 to-cyan-500 flex items-center justify-center font-black text-xs text-white shadow-md">
                  DSCE
                </div>
                <div>
                  <h4 className="font-black text-xs tracking-wide text-cyan-400 print:text-blue-900 leading-tight">
                    {idCardData.institution_name || "DHANALAKSHMI SRINIVASAN COLLEGE OF ENGINEERING"}
                  </h4>
                  <p className="text-[8px] font-bold text-slate-300 print:text-slate-800 tracking-wider">
                    {idCardData.institution_location || "TIRUCHIRAPPALLI (TRICHY), TAMIL NADU"}
                  </p>
                </div>
              </div>
              <p className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold print:text-slate-600 mt-1">
                {idCardData.institution_affiliation || "Affiliated to Anna University, Chennai | AICTE Approved"}
              </p>
              <div className="h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent my-1.5"></div>
            </div>

            {/* Student Photo Section */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-28 h-32 rounded-xl overflow-hidden border-2 border-cyan-400 shadow-md bg-slate-800 flex items-center justify-center">
                  {idCardData.profile_image_url ? (
                    <img
                      src={idCardData.profile_image_url}
                      alt={idCardData.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 text-xs">
                      <GraduationCap className="w-10 h-10 text-cyan-400 mb-1" />
                      <span>Passport Photo</span>
                    </div>
                  )}
                </div>
                {/* Upload overlay trigger for convenience */}
                <label className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition text-[10px] text-cyan-300 print:hidden">
                  <span>Upload Photo</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>

              {/* Student Name & Roll */}
              <h3 className="mt-3 text-lg font-black text-white print:text-black tracking-wide text-center">
                {idCardData.full_name}
              </h3>
              <div className="inline-block mt-0.5 px-3 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 print:text-blue-900 font-mono font-bold text-xs">
                ROLL: {idCardData.roll_number}
              </div>
            </div>

            {/* Key Academic Details Table */}
            <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs space-y-1.5 print:bg-slate-100 print:text-black">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Department:</span>
                <span className="font-bold text-white print:text-black text-right truncate max-w-[170px]">{idCardData.department_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Program:</span>
                <span className="font-bold text-cyan-400 print:text-blue-900">{idCardData.program_name} ({idCardData.degree_level})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Batch / Year:</span>
                <span className="font-semibold text-slate-200 print:text-black">{idCardData.batch_name} (Sem {idCardData.semester_number})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Reg No:</span>
                <span className="font-mono text-slate-200 print:text-black">{idCardData.registration_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Blood Group:</span>
                <span className="font-bold text-rose-400 print:text-rose-700">{idCardData.blood_group}</span>
              </div>
            </div>

            {/* Card Footer with Hologram Badge & Validity */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 print:text-black">
              <div className="flex items-center space-x-1 text-cyan-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="font-semibold uppercase tracking-wider">Valid Till {idCardData.valid_until}</span>
              </div>
              <div className="text-right font-mono text-[9px] text-slate-500">
                {idCardData.institution_code || "CODE: 3124"}
              </div>
            </div>

          </div>

          {/* ===================== BACK OF ID CARD ===================== */}
          <div className="w-[340px] h-[520px] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-slate-700/80 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col justify-between text-white p-5 print:border-2 print:border-black print:text-black print:bg-white">
            
            {/* Top Lanyard Punch Hole Decoration */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-2.5 rounded-full bg-slate-800 border border-slate-700 print:border-black"></div>

            {/* Back Header */}
            <div className="text-center pt-2">
              <h5 className="font-bold text-xs uppercase tracking-widest text-cyan-400 print:text-blue-900">
                EMERGENCY & OFFICIAL INFORMATION
              </h5>
              <div className="h-0.5 bg-slate-800 my-2"></div>
            </div>

            {/* Detailed Contact List */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start space-x-2">
                <Calendar className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Date of Birth</p>
                  <p className="font-bold text-slate-200 print:text-black">{idCardData.dob}</p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Student Phone</p>
                  <p className="font-bold text-slate-200 print:text-black">{idCardData.phone}</p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Phone className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Emergency / Guardian Contact</p>
                  <p className="font-bold text-slate-200 print:text-black">
                    {idCardData.parent_name}: {idCardData.emergency_contact}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Institutional Email</p>
                  <p className="font-mono text-[11px] text-slate-200 print:text-black break-all">{idCardData.college_email}</p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Residential / Hostel Address</p>
                  <p className="text-[11px] text-slate-300 print:text-black line-clamp-2">{idCardData.residential_address}</p>
                </div>
              </div>
            </div>

            {/* Instructions & Barcode / QR Simulation */}
            <div className="space-y-3 pt-2">
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-[9px] text-slate-400 leading-relaxed print:bg-slate-100 print:text-black">
                <p className="font-semibold text-slate-300 print:text-black mb-0.5">TERMS & CONDITIONS:</p>
                1. This card is non-transferable and must be carried on campus at all times.<br/>
                2. If found, please return to: Office of the Principal, Dhanalakshmi Srinivasan College of Engineering, Trichy, Tamil Nadu.
              </div>

              {/* Barcode & Official Digital Signature */}
              <div className="flex items-end justify-between pt-1">
                <div className="text-center">
                  <div className="font-mono font-bold tracking-widest text-xs text-white print:text-black">
                    ||||| | |||| || ||| ||||
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase">{idCardData.roll_number}</span>
                </div>

                <div className="text-center flex flex-col items-center">
                  {/* Digital Signature Emblem & Script */}
                  <div className="font-serif italic font-bold text-cyan-300 print:text-blue-900 text-xs tracking-wider -mb-0.5">
                    Dr. S. Rajasekaran
                  </div>
                  <div className="w-24 border-b border-slate-500 print:border-black mb-0.5"></div>
                  <span className="text-[8px] font-bold text-slate-400 print:text-black uppercase tracking-wider">
                    {idCardData.principal_sign_title || "PRINCIPAL / DEAN"}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500 print:hidden">
          <span>Tip: Click <b>Print / Download PDF</b> to save this ID card as a high-resolution PDF or print it directly.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
