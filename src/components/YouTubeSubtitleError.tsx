import React from 'react';

interface YouTubeSubtitleErrorProps {
  error?: string;
  videoId?: string;
  onTryAgain?: () => void;
}

const YouTubeSubtitleError: React.FC<YouTubeSubtitleErrorProps> = ({
  error = 'No subtitles available',
  videoId,
  onTryAgain
}) => {
  return (
    <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 text-orange-800">
      <h3 className="text-lg font-semibold mb-2">Cannot Process This Video</h3>
      
      <p className="mb-3">
        This video does not have available subtitles or captions, which are required to generate notes.
      </p>
      
      {error === 'yt-dlp_required' && (
        <div className="mb-3 p-3 bg-gray-100 rounded text-sm font-mono">
          <p className="font-bold mb-1">Installation Required:</p>
          <p>This system requires yt-dlp to extract YouTube subtitles. Please install yt-dlp:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>macOS: <code>brew install yt-dlp</code></li>
            <li>Linux/macOS: <code>pip install yt-dlp</code></li>
            <li>Windows: <code>pip install yt-dlp</code> or <code>choco install yt-dlp</code></li>
          </ul>
        </div>
      )}
      
      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        {onTryAgain && (
          <button
            onClick={onTryAgain}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            Try Again
          </button>
        )}
        
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors inline-flex items-center"
        >
          View on YouTube
        </a>
        
        <a
          href="/generate/youtube"
          className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
        >
          Try Another Video
        </a>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Why is this happening?</p>
        <ul className="list-disc pl-5 mt-1">
          <li>The video creator hasn't added subtitles/captions</li>
          <li>Auto-generated captions aren't available for this video</li>
          <li>The video might be too new or not popular enough for auto-captions</li>
          <li>YouTube's subtitle system is not working for this video</li>
        </ul>
      </div>
    </div>
  );
};

export default YouTubeSubtitleError; 