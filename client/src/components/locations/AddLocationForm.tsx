import { Camera, QrCode, Trash2 } from "lucide-react";

interface AddLocationFormProps {
  locationName: string;
  setLocationName: (name: string) => void;
  locationNotes: string;
  setLocationNotes: (notes: string) => void;
  pinPlacement: string;
  setPinPlacement: (pinPlacement: string) => void;
  imageData: string | null;
  handleCapturePhoto: () => void;
  barcodes: string[];
  handleRemoveBarcode: (index: number) => void;
  handleScanBarcode: () => void;
  handleSaveLocation: () => void;
  isSubmitting: boolean;
}

const AddLocationForm: React.FC<AddLocationFormProps> = ({
  locationName,
  setLocationName,
  locationNotes,
  setLocationNotes,
  pinPlacement,
  setPinPlacement,
  imageData,
  handleCapturePhoto,
  barcodes,
  handleRemoveBarcode,
  handleScanBarcode,
  handleSaveLocation,
  isSubmitting
}) => {
  return (
    <>
      {/* Location Form */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="mb-4">
          <label htmlFor="locationName" className="block text-sm font-medium text-gray-700 mb-1">
            GroupID Number
          </label>
          <div className="flex rounded-md overflow-hidden border border-gray-300">
            <span className="bg-gray-100 px-3 py-2 text-gray-500 flex items-center border-r">#</span>
            <input 
              type="text" 
              id="locationName" 
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="flex-1 py-2 px-3 focus:ring-[#2962FF] focus:border-[#2962FF] block w-full sm:text-sm border-transparent" 
              placeholder="001" 
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            The GroupID will be assigned the next sequential number automatically.
          </p>
        </div>
        
        <div className="mb-4">
          <label htmlFor="locationNotes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea 
            id="locationNotes" 
            rows={2} 
            value={locationNotes}
            onChange={(e) => setLocationNotes(e.target.value)}
            className="py-2 px-3 block w-full border border-gray-300 rounded-md focus:ring-[#2962FF] focus:border-[#2962FF]" 
            placeholder="Add any details about this location"
          ></textarea>
        </div>
        
        <div className="mb-4">
          <label htmlFor="pinPlacement" className="block text-sm font-medium text-gray-700 mb-1">
            Where to place pin
          </label>
          <input 
            type="text" 
            id="pinPlacement" 
            value={pinPlacement}
            onChange={(e) => setPinPlacement(e.target.value)}
            className="py-2 px-3 block w-full border border-gray-300 rounded-md focus:ring-[#2962FF] focus:border-[#2962FF]" 
            placeholder="Enter pin placement description"
          />
        </div>
      </div>
      
      {/* Photo Section */}
      {!imageData ? (
        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-medium">Capture Location Photo</h3>
          </div>
          
          <div className="bg-gray-900 aspect-video flex items-center justify-center">
            <div className="text-white opacity-50">
              <Camera className="h-10 w-10 mx-auto mb-2" />
              <p>Click the button below to take a photo</p>
            </div>
          </div>
          
          <div className="p-4 flex justify-center">
            <button 
              onClick={handleCapturePhoto}
              className="bg-[#FF6D00] text-white rounded-full w-16 h-16 flex items-center justify-center"
            >
              <Camera className="h-6 w-6" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium">Location Photo</h3>
            <button 
              onClick={handleCapturePhoto}
              className="text-[#2962FF] text-sm flex items-center"
            >
              <Camera className="h-4 w-4 mr-1" />
              Retake
            </button>
          </div>
          
          <div className="aspect-video bg-gray-200">
            <img 
              src={imageData} 
              alt="Location preview" 
              className="w-full h-full object-cover" 
            />
          </div>
        </div>
      )}
      
      {/* Barcode Scanner Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <h3 className="font-medium">Scan Product Barcodes</h3>
          <p className="text-sm text-gray-500">
            Scan one or more product barcodes to associate with this GroupID location.
          </p>
        </div>
        
        <div className="p-4">
          {barcodes.length > 0 ? (
            <div className="space-y-2">
              {barcodes.map((barcode, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                  <div className="flex items-center">
                    <QrCode className="h-4 w-4 text-[#2962FF] mr-2" />
                    <span>{barcode}</span>
                  </div>
                  <button 
                    onClick={() => handleRemoveBarcode(index)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <QrCode className="h-8 w-8 mx-auto mb-2" />
              <p>No product barcodes scanned yet</p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t">
          <button 
            onClick={handleScanBarcode}
            className="bg-[#2962FF] text-white px-4 py-2 rounded-lg w-full flex items-center justify-center"
          >
            <QrCode className="h-4 w-4 mr-1" />
            Scan Product Barcode
          </button>
        </div>
      </div>
      
      {/* Save Button */}
      <div className="mb-4">
        <button 
          onClick={handleSaveLocation}
          disabled={isSubmitting}
          className="bg-[#00C853] text-white px-6 py-3 rounded-lg w-full font-medium disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2 inline-block"></div>
              Saving...
            </>
          ) : (
            'Save GroupID'
          )}
        </button>
      </div>
    </>
  );
};

export default AddLocationForm;
