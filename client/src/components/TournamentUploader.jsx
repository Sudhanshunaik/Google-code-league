import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UploadCloud, CheckCircle, AlertCircle, Loader2, Edit3, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TournamentUploader() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'manual'
  
  // Upload State
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [errorMessage, setErrorMessage] = useState('');

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
      setFile(null);
    } catch (err) {
      console.error('Upload failed:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Failed to upload flyer.');
    }
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
    <div className="max-w-md mx-auto mt-12 p-6 glass rounded-2xl shadow-xl border border-border">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold font-display text-text-primary">Host a Tournament</h2>
        <p className="text-text-secondary text-sm mt-2">
          Let our AI read your flyer, or enter details manually.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-card rounded-xl p-1 mb-6 border border-border">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer border-none ${
            activeTab === 'upload' ? 'bg-orange-600 text-white shadow-sm' : 'bg-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Image size={16} /> AI Upload
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer border-none ${
            activeTab === 'manual' ? 'bg-orange-600 text-white shadow-sm' : 'bg-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Edit3 size={16} /> Manual Entry
        </button>
      </div>

      {activeTab === 'upload' && (
        <div className="text-center">
          <UploadCloud size={48} className="mx-auto text-orange-500 mb-4" />
          
          {status === 'success' ? (
            <div className="bg-goa-palm/10 border border-goa-palm/20 p-4 rounded-xl flex flex-col items-center">
              <CheckCircle size={32} className="text-goa-palm mb-2" />
              <p className="text-goa-palm font-medium">Flyer received!</p>
              <p className="text-text-secondary text-sm mt-1">Our AI is verifying the details. It will appear on the map shortly.</p>
              <button 
                onClick={() => setStatus('idle')}
                className="mt-4 text-sm text-text-muted hover:text-text-primary underline bg-transparent border-none cursor-pointer"
              >
                Upload another
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <label className="block w-full cursor-pointer bg-surface-input border border-dashed border-text-muted hover:border-orange-500 rounded-xl p-4 transition-colors">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                  disabled={status === 'uploading'}
                />
                <span className="text-text-secondary font-medium block">
                  {file ? file.name : 'Click to select flyer image'}
                </span>
              </label>

              {status === 'error' && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg text-left">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!file || status === 'uploading'}
                className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-4 rounded-xl w-full flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {status === 'uploading' ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Flyer'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'manual' && (
        <div>
          {manualStatus === 'success' ? (
            <div className="bg-goa-palm/10 border border-goa-palm/20 p-4 rounded-xl flex flex-col items-center text-center">
              <CheckCircle size={32} className="text-goa-palm mb-2" />
              <p className="text-goa-palm font-medium">Match created successfully!</p>
              <p className="text-text-secondary text-sm mt-1">Redirecting to match page...</p>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-text-secondary mb-1">Sport</label>
                  <select 
                    required
                    value={manualData.sport}
                    onChange={(e) => setManualData({...manualData, sport: e.target.value})}
                    className="w-full bg-surface-input border border-border rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-orange-500"
                  >
                    <option value="Football">Football</option>
                    <option value="Futsal">Futsal</option>
                    <option value="Cricket">Cricket</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Volleyball">Volleyball</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-text-secondary mb-1">Format</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. 5v5"
                    value={manualData.format}
                    onChange={(e) => setManualData({...manualData, format: e.target.value})}
                    className="w-full bg-surface-input border border-border rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Location / Turf</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Calangute Beach Turf"
                  value={manualData.location}
                  onChange={(e) => setManualData({...manualData, location: e.target.value})}
                  className="w-full bg-surface-input border border-border rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Date & Time</label>
                <input 
                  type="datetime-local"
                  required
                  value={manualData.match_time}
                  onChange={(e) => setManualData({...manualData, match_time: e.target.value})}
                  className="w-full bg-surface-input border border-border rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-text-secondary mb-1">Capacity</label>
                  <input 
                    type="number"
                    required
                    min="2"
                    value={manualData.capacity}
                    onChange={(e) => setManualData({...manualData, capacity: e.target.value})}
                    className="w-full bg-surface-input border border-border rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-text-secondary mb-1">Price (₹)</label>
                  <input 
                    type="number"
                    required
                    min="0"
                    value={manualData.price}
                    onChange={(e) => setManualData({...manualData, price: e.target.value})}
                    className="w-full bg-surface-input border border-border rounded-lg p-2.5 text-text-primary focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {manualStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg text-left">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={manualStatus === 'uploading'}
                className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-4 rounded-xl w-full flex justify-center items-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {manualStatus === 'uploading' ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Match'
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
