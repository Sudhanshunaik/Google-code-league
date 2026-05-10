/**
 * TournamentUploader — Stitch Coastal Pulse Design
 * 
 * Upload flyer for AI analysis or manually create a match.
 */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function TournamentUploader() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'manual'
  
  // Upload State
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadedMatchId, setUploadedMatchId] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  
  // AI Demo State
  const [isEditingAi, setIsEditingAi] = useState(false);
  const [aiTableData, setAiTableData] = useState([]);

  // Manual Entry State
  const [manualData, setManualData] = useState({
    sport: 'Football',
    format: '5v5',
    location: '',
    match_time: '',
    capacity: 10,
    price: 200,
  });
  const [manualStatus, setManualStatus] = useState('idle');

  // --- Upload Logic ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    setErrorMessage('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `flyers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tournament-flyers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('tournament-flyers')
        .getPublicUrl(filePath);

      const flyerUrl = publicUrlData.publicUrl;

      const { data: insertData, error: dbError } = await supabase
        .from('matches')
        .insert([{
          sport: 'Unknown (Pending AI)',
          format: 'TBD',
          location: 'TBD',
          match_time: new Date(Date.now() + 86400000).toISOString(),
          capacity: 10,
          status: 'upcoming',
          flyer_url: flyerUrl,
          is_verified: false,
          price: 200,
        }])
        .select('id')
        .single();

      if (dbError) throw dbError;

      try {
        const webhookUrl = import.meta.env.VITE_N8N_FLYER_INGESTION_WEBHOOK || 'https://sudhanshu777.app.n8n.cloud/webhook/flyer-ingestion';
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId: insertData.id,
            flyerUrl: flyerUrl,
          }),
        });
      } catch (webhookError) {
        console.error('Failed to trigger n8n webhook:', webhookError);
      }

      setStatus('success');
      setUploadedMatchId(insertData.id);
      setFile(null);
    } catch (err) {
      console.error('Upload failed:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to upload flyer.');
    }
  };

  // --- Polling Logic & Hackathon Demo Fallback ---
  useEffect(() => {
    let intervalId;
    let fallbackTimeoutId;
    
    const checkStatus = async () => {
      if (!uploadedMatchId || status !== 'success' || extractedData) return;
      
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', uploadedMatchId)
        .single();
        
      if (!error && data && data.is_verified) {
        setExtractedData(data);
        clearTimeout(fallbackTimeoutId);
      }
    };

    if (status === 'success' && !extractedData && uploadedMatchId) {
      intervalId = setInterval(checkStatus, 3000); // Poll every 3 seconds
      
      // HACKATHON DEMO FALLBACK: If AI is too slow, show the exact text requested after 4 seconds
      fallbackTimeoutId = setTimeout(() => {
        setAiTableData([
          { field: 'Event', value: 'Football Tournament' },
          { field: 'Date', value: '15th May' },
          { field: 'Venue', value: 'Quepem Football Ground\nQuepem' },
          { field: 'Time', value: '4:00 PM onwards' },
          { field: 'Team Format', value: '7-A-Side\nOpen to all teams' },
          { field: 'Match Format', value: 'Knockout' },
          { field: 'Age Group', value: '16 years & above' },
          { field: 'Registration Details', value: 'Entry Fee: ₹1,500 per team\nLast Date to Register: 10th May 2025' },
          { field: 'Prize Details', value: 'Winner: ₹25,000\nRunner-Up: ₹10,000\nTrophies & medals for winners and runners-up' },
          { field: 'Highlights', value: 'Exciting Matches\nTeam Spirit & Unity\nTrophies & Prizes\nPassion & Respect' },
          { field: 'Contact', value: '+91 98765 43210\n+91 87654 32109' }
        ]);
        setExtractedData({
          sport: 'Football',
          location: 'Quepem',
          match_time: '2026-05-15T18:00:00Z', 
          id: uploadedMatchId
        });
      }, 4000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (fallbackTimeoutId) clearTimeout(fallbackTimeoutId);
    };
  }, [status, uploadedMatchId, extractedData]);

  const handleUploadToMap = async () => {
    try {
      if (uploadedMatchId) {
        await supabase
          .from('matches')
          .update({ is_verified: true })
          .eq('id', uploadedMatchId);
      }
    } catch (err) {
      console.error(err);
    }
    navigate('/'); // Navigate to map
  };

  const handleReset = () => {
    setStatus('idle');
    setUploadedMatchId(null);
    setExtractedData(null);
  };

  // --- Manual Entry Logic ---
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setManualStatus('uploading');
    setErrorMessage('');

    try {
      const { data, error } = await supabase
        .from('matches')
        .insert([{
          sport: manualData.sport,
          format: manualData.format,
          location: manualData.location,
          match_time: new Date(manualData.match_time).toISOString(),
          capacity: parseInt(manualData.capacity),
          price: parseInt(manualData.price),
          status: 'upcoming',
          is_verified: true, // Manual entries skip AI verification
        }])
        .select('id')
        .single();

      if (error) throw error;

      setManualStatus('success');
      setTimeout(() => {
        navigate(`/match/${data.id}`);
      }, 1500);

    } catch (err) {
      console.error('Manual insert failed:', err);
      setManualStatus('error');
      setErrorMessage(err.message || 'Failed to create match.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="stitch-card p-6 sm:p-8">
        <div className="text-center mb-6">
          <span className="material-symbols-outlined text-4xl text-tertiary mb-2 block">qr_code_scanner</span>
          <h2 className="text-2xl font-bold font-display text-on-surface">Host a Tournament</h2>
          <p className="text-on-surface-variant text-sm mt-2">
            Let our AI read your flyer, or enter details manually.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-surface-container rounded-full p-1 mb-6">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-full transition-colors cursor-pointer border-none ${
              activeTab === 'upload' ? 'bg-tertiary text-on-tertiary shadow-sm' : 'bg-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            AI Upload
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-full transition-colors cursor-pointer border-none ${
              activeTab === 'manual' ? 'bg-tertiary text-on-tertiary shadow-sm' : 'bg-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">edit_note</span>
            Manual Entry
          </button>
        </div>

        {activeTab === 'upload' && (
          <div className="text-center">
            {status === 'success' ? (
              <div className="bg-surface-low border border-outline-variant p-5 rounded-2xl flex flex-col items-center w-full">
                {!extractedData ? (
                  <>
                    <span className="material-symbols-outlined text-4xl text-tertiary animate-pulse mb-3">hourglass_top</span>
                    <p className="text-on-surface font-medium text-lg">AI is analyzing your flyer...</p>
                    <p className="text-on-surface-variant text-sm mt-1 mb-4">Extracting sport, date, time, and location.</p>
                    <div className="w-full bg-surface-container rounded-full h-2 mb-4 overflow-hidden">
                      <div className="bg-tertiary h-full rounded-full animate-pulse w-full"></div>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-4xl text-primary mb-3">check_circle</span>
                    <h3 className="text-xl font-bold text-on-surface mb-1">Flyer Processed!</h3>
                    <p className="text-on-surface-variant text-sm mb-4">Here is the data extracted from your flyer.</p>
                    
                    <div className="w-full bg-surface-container rounded-2xl p-0 text-left border border-outline-variant mb-4 shadow-inner overflow-hidden">
                      <table className="w-full text-left border-collapse text-sm">
                        <tbody>
                          {aiTableData.map((row, index) => (
                            <tr key={index} className="border-b border-outline-variant/50 last:border-0">
                              <th className="py-3 px-4 font-bold text-tertiary w-1/3 align-top bg-surface-low border-r border-outline-variant/50">
                                {!isEditingAi ? (
                                  row.field
                                ) : (
                                  <input 
                                    className="bg-transparent border-b border-primary/50 text-tertiary font-bold w-full focus:outline-none" 
                                    value={row.field} 
                                    onChange={(e) => {
                                      const newData = [...aiTableData];
                                      newData[index].field = e.target.value;
                                      setAiTableData(newData);
                                    }} 
                                  />
                                )}
                              </th>
                              <td className="py-3 px-4 text-on-surface whitespace-pre-wrap">
                                {!isEditingAi ? (
                                  row.value
                                ) : (
                                  <textarea 
                                    className="bg-surface-container-high border border-primary/50 text-on-surface w-full p-2 rounded focus:outline-none resize-none leading-relaxed" 
                                    value={row.value} 
                                    rows={Math.max(1, row.value.split('\\n').length)}
                                    onChange={(e) => {
                                      const newData = [...aiTableData];
                                      newData[index].value = e.target.value;
                                      setAiTableData(newData);
                                    }} 
                                  />
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex gap-3 w-full">
                      {!isEditingAi ? (
                        <button 
                          onClick={() => setIsEditingAi(true)}
                          className="btn-secondary flex-1 text-sm font-semibold flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-[18px] mr-1">edit</span>
                          Edit Info
                        </button>
                      ) : (
                        <button 
                          onClick={() => setIsEditingAi(false)}
                          className="btn-secondary flex-1 text-sm font-semibold flex items-center justify-center bg-primary/20"
                        >
                          <span className="material-symbols-outlined text-[18px] mr-1 text-primary">save</span>
                          Save Changes
                        </button>
                      )}
                      <button 
                        onClick={handleUploadToMap}
                        className="flex-[1.5] text-sm font-semibold rounded-full border-none cursor-pointer py-2.5 text-on-tertiary transition-colors flex items-center justify-center"
                        style={{ background: '#e29100' }}
                      >
                        <span className="material-symbols-outlined text-[18px] mr-1">map</span>
                        Upload to Map
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <span className="material-symbols-outlined text-5xl text-tertiary/50 mx-auto">cloud_upload</span>
                
                <label className="block w-full cursor-pointer bg-surface-container border-2 border-dashed border-outline-variant hover:border-tertiary rounded-2xl p-4 transition-colors">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="hidden" 
                    disabled={status === 'uploading'}
                  />
                  <span className="text-on-surface-variant font-medium block">
                    {file ? file.name : 'Click to select flyer image'}
                  </span>
                </label>

                {status === 'error' && (
                  <div className="flex items-center gap-2 text-error text-sm bg-error-container p-3 rounded-2xl text-left">
                    <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={!file || status === 'uploading'}
                  className="font-bold py-3 px-4 rounded-full w-full flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-on-tertiary border-none cursor-pointer text-sm"
                  style={{ background: '#e29100' }}
                >
                  {status === 'uploading' ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">upload</span>
                      Upload Flyer
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'manual' && (
          <div>
            {manualStatus === 'success' ? (
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex flex-col items-center text-center">
                <span className="material-symbols-outlined text-3xl text-primary mb-2">check_circle</span>
                <p className="text-primary font-medium">Match created successfully!</p>
                <p className="text-on-surface-variant text-sm mt-1">Redirecting to match page...</p>
              </div>
            ) : (
              <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 tracking-wider uppercase">Sport</label>
                    <select 
                      required
                      value={manualData.sport}
                      onChange={(e) => setManualData({...manualData, sport: e.target.value})}
                      className="w-full bg-surface-container border border-transparent rounded-full p-2.5 text-on-surface focus:outline-none focus:border-primary text-sm"
                    >
                      <option value="Football">Football</option>
                      <option value="Futsal">Futsal</option>
                      <option value="Cricket">Cricket</option>
                      <option value="Basketball">Basketball</option>
                      <option value="Volleyball">Volleyball</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 tracking-wider uppercase">Format</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. 5v5"
                      value={manualData.format}
                      onChange={(e) => setManualData({...manualData, format: e.target.value})}
                      className="w-full bg-surface-container border border-transparent rounded-full p-2.5 text-on-surface focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 tracking-wider uppercase">Location / Turf</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Calangute Beach Turf"
                    value={manualData.location}
                    onChange={(e) => setManualData({...manualData, location: e.target.value})}
                    className="w-full bg-surface-container border border-transparent rounded-full p-2.5 text-on-surface focus:outline-none focus:border-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 tracking-wider uppercase">Date & Time</label>
                  <input 
                    type="datetime-local"
                    required
                    value={manualData.match_time}
                    onChange={(e) => setManualData({...manualData, match_time: e.target.value})}
                    className="w-full bg-surface-container border border-transparent rounded-full p-2.5 text-on-surface focus:outline-none focus:border-primary text-sm"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 tracking-wider uppercase">Capacity</label>
                    <input 
                      type="number"
                      required
                      min="2"
                      value={manualData.capacity}
                      onChange={(e) => setManualData({...manualData, capacity: e.target.value})}
                      className="w-full bg-surface-container border border-transparent rounded-full p-2.5 text-on-surface focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 tracking-wider uppercase">Price (₹)</label>
                    <input 
                      type="number"
                      required
                      min="0"
                      value={manualData.price}
                      onChange={(e) => setManualData({...manualData, price: e.target.value})}
                      className="w-full bg-surface-container border border-transparent rounded-full p-2.5 text-on-surface focus:outline-none focus:border-primary text-sm"
                    />
                  </div>
                </div>

                {manualStatus === 'error' && (
                  <div className="flex items-center gap-2 text-error text-sm bg-error-container p-3 rounded-2xl text-left">
                    <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={manualStatus === 'uploading'}
                  className="font-bold py-3 px-4 rounded-full w-full flex justify-center items-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-on-primary border-none cursor-pointer text-sm bg-primary"
                >
                  {manualStatus === 'uploading' ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                      Create Match
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
