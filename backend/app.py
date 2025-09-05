from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Pinterest API endpoints
PINTEREST_API_BASE = "https://api.pinterest.com/v5"
PINTEREST_OAUTH_URL = "https://www.pinterest.com/oauth"

# Google Custom Search API
GOOGLE_SEARCH_URL = "https://www.googleapis.com/customsearch/v1"

@app.route('/api/pinterest/auth')
def pinterest_auth():
    # Redirect users to Pinterest OAuth
    redirect_uri = request.args.get('redirect_uri')
    auth_url = f"{PINTEREST_OAUTH_URL}?response_type=code&client_id={os.getenv('PINTEREST_APP_ID')}&redirect_uri={redirect_uri}&scope=boards:read,pins:read"
    return jsonify({'auth_url': auth_url})

@app.route('/api/pinterest/callback')
def pinterest_callback():
    # Handle Pinterest OAuth callback
    code = request.args.get('code')
    # Exchange code for access token
    token_url = f"{PINTEREST_OAUTH_URL}/token"
    data = {
        'client_id': os.getenv('PINTEREST_APP_ID'),
        'client_secret': os.getenv('PINTEREST_APP_SECRET'),
        'code': code,
        'grant_type': 'authorization_code'
    }
    response = requests.post(token_url, data=data)
    return jsonify(response.json())

@app.route('/api/pinterest/feed')
def pinterest_feed():
    # Get user's Pinterest feed
    access_token = request.headers.get('Authorization')
    headers = {'Authorization': f'Bearer {access_token}'}
    response = requests.get(f"{PINTEREST_API_BASE}/pins", headers=headers)
    return jsonify(response.json())

@app.route('/api/search/products')
def search_products():
    # Search for products using Google Custom Search
    image_url = request.args.get('image_url')
    api_key = os.getenv('GOOGLE_API_KEY')
    search_engine_id = os.getenv('GOOGLE_SEARCH_ENGINE_ID')
    
    params = {
        'key': api_key,
        'cx': search_engine_id,
        'q': image_url,
        'searchType': 'image'
    }
    
    response = requests.get(GOOGLE_SEARCH_URL, params=params)
    results = response.json()
    
    # Filter and process results
    shopping_domains = ['amazon.com', 'ebay.com', 'etsy.com', 'asos.com', 'zara.com', 
                       'nordstrom.com', 'macys.com', 'h&m.com', 'gap.com', 'uniqlo.com']
    shopping_results = []
    
    for item in results.get('items', []):
        if any(domain in item['link'].lower() for domain in shopping_domains):
            shopping_results.append({
                'title': item['title'],
                'link': item['link'],
                'image': item.get('image', {}).get('thumbnailLink', '')
            })
    
    return jsonify({'results': shopping_results})

@app.route('/api/health')
def health_check():
    return jsonify({'status': 'OK', 'message': 'Server is running'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
