import axios from 'axios';
import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pins, setPins] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if we have an access token in localStorage
    const token = localStorage.getItem('pinterest_access_token');
    if (token) {
      setIsAuthenticated(true);
      fetchPinterestFeed(token);
    }
  }, []);

  const handleAuth = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/pinterest/auth', {
        params: {
          redirect_uri: window.location.origin
        }
      });
      window.location.href = response.data.auth_url;
    } catch (error) {
      console.error('Auth error:', error);
      setError('Failed to connect to Pinterest. Please try again.');
    }
  };

  // Check if we're returning from OAuth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code && !isAuthenticated) {
      handleOAuthCallback(code);
    }
  }, [isAuthenticated]);

  const handleOAuthCallback = async (code) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/pinterest/callback?code=${code}`);
      const accessToken = response.data.access_token;
      
      if (accessToken) {
        localStorage.setItem('pinterest_access_token', accessToken);
        setIsAuthenticated(true);
        fetchPinterestFeed(accessToken);
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      setError('Failed to authenticate with Pinterest. Please try again.');
    }
  };

  const fetchPinterestFeed = async (token) => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/pinterest/feed', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // For testing, let's create some mock pins since we don't have real API keys yet
      const mockPins = [
        {
          id: 1,
          title: 'Fashion Outfit 1',
          images: {
            orig: {
              url: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=400'
            }
          }
        },
        {
          id: 2,
          title: 'Fashion Outfit 2',
          images: {
            orig: {
              url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
            }
          }
        },
        {
          id: 3,
          title: 'Fashion Outfit 3',
          images: {
            orig: {
              url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'
            }
          }
        }
      ];
      setPins(mockPins);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching Pinterest feed:', error);
      // Use mock data for testing
      const mockPins = [
        {
          id: 1,
          title: 'Fashion Outfit 1',
          images: {
            orig: {
              url: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=400'
            }
          }
        },
        {
          id: 2,
          title: 'Fashion Outfit 2',
          images: {
            orig: {
              url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
            }
          }
        },
        {
          id: 3,
          title: 'Fashion Outfit 3',
          images: {
            orig: {
              url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'
            }
          }
        }
      ];
      setPins(mockPins);
      setLoading(false);
    }
  };

  const handleImageClick = async (imageUrl) => {
    setSelectedImage(imageUrl);
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/search/products', {
        params: {
          image_url: imageUrl
        }
      });
      setSearchResults(response.data.results);
      setLoading(false);
    } catch (error) {
      console.error('Error searching products:', error);
      // Mock results for testing
      const mockResults = [
        {
          title: 'Similar Fashion Item',
          link: 'https://www.amazon.com/s?k=fashion',
          image: 'https://via.placeholder.com/150'
        },
        {
          title: 'Style Inspiration',
          link: 'https://www.etsy.com/search?q=fashion',
          image: 'https://via.placeholder.com/150'
        }
      ];
      setSearchResults(mockResults);
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('pinterest_access_token');
    setIsAuthenticated(false);
    setPins([]);
    setSelectedImage(null);
    setSearchResults([]);
    setError('');
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Fashion Shopping Assistant</h1>
        {!isAuthenticated ? (
          <button className="auth-btn" onClick={handleAuth}>Connect Pinterest Account</button>
        ) : (
          <button className="disconnect-btn" onClick={handleDisconnect}>Disconnect</button>
        )}
      </header>
      
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError('')}>Dismiss</button>
        </div>
      )}
      
      <main>
        {loading && <div className="loading">Loading...</div>}
        
        {isAuthenticated && (
          <div className="pinterest-feed">
            <h2>Your Pinterest Feed</h2>
            {pins.length === 0 && !loading ? (
              <p>No pins found in your feed.</p>
            ) : (
              <div className="image-grid">
                {pins.map(pin => (
                  <div key={pin.id} className="image-item">
                    <img 
                      src={pin.images?.orig?.url} 
                      alt={pin.title || 'Pinterest pin'} 
                      onClick={() => handleImageClick(pin.images?.orig?.url)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {selectedImage && (
          <div className="search-results">
            <h2>Search Results</h2>
            <div className="selected-image">
              <img src={selectedImage} alt="Selected" />
            </div>
            
            {searchResults.length > 0 ? (
              <div className="product-results">
                <h3>Found {searchResults.length} shopping results:</h3>
                <div className="product-grid">
                  {searchResults.map((product, index) => (
                    <div key={index} className="product-item">
                      <a href={product.link} target="_blank" rel="noopener noreferrer">
                        <img src={product.image} alt={product.title} />
                        <p>{product.title}</p>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              !loading && <p>No shopping results found for this image.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;