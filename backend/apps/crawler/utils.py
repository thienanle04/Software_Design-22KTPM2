import requests
from bs4 import BeautifulSoup
from .models import Article
import json
from datetime import datetime
import re

HEADERS = {'User-Agent': 'Mozilla/5.0'}

def clean_text(text):
    """Clean and normalize text content"""
    text = re.sub(r'\[\d+\]', '', text)  # Remove citation numbers
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def fetch_wikipedia_article(keyword):
    """Fetch article from Wikipedia"""
    url = f"https://en.wikipedia.org/wiki/{keyword.replace(' ', '_')}"
    
    try:
        response = requests.get(url, timeout=10, headers=HEADERS)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove table of contents and infoboxes
            for element in soup.find_all(['table', 'div']):
                if 'infobox' in element.get('class', []):
                    element.decompose()
            
            title_tag = soup.find('h1')
            title = title_tag.text.strip() if title_tag else keyword
            content = ' '.join([clean_text(p.text) for p in soup.find_all('p') if p.text.strip()])
            
            return {
                'source': 'Wikipedia',
                'title': title,
                'content': content[:5000],  # Limit content length
                'url': url,
                'last_updated': datetime.now()
            }
    except Exception as e:
        print(f"Wikipedia fetch error: {e}")
    return None

def fetch_nature_articles(keyword):
    """Fetch relevant articles from Nature"""
    search_url = f"https://www.nature.com/search?q={keyword.replace(' ', '+')}"
    articles = []

    try:
        response = requests.get(search_url, timeout=10, headers=HEADERS)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Get first 3 article links
            for item in soup.select('li.app-article-list-row__item')[:3]:
                link = item.find('a', href=True)
                if link and '/articles/' in link['href']:
                    article_url = f"https://www.nature.com{link['href']}"

                    # Fetch individual article
                    article_resp = requests.get(article_url, timeout=10, headers=HEADERS)
                    if article_resp.status_code == 200:
                        article_soup = BeautifulSoup(article_resp.text, 'html.parser')
                        title_tag = article_soup.find('h1')
                        title = title_tag.text.strip() if title_tag else keyword

                        # Get main content
                        content = ' '.join(
                            [clean_text(p.text) for p in article_soup.select('div.c-article-body p')]
                        )

                        if content:
                            articles.append({
                                'source': 'Nature',
                                'title': title,
                                'content': content[:5000],  # Giới hạn độ dài
                                'url': article_url,
                                'last_updated': datetime.now()
                            })
    except Exception as e:
        print(f"Nature fetch error: {e}")
    return articles

def fetch_pubmed_articles(keyword):
    """Fetch relevant articles from PubMed"""
    search_url = f"https://pubmed.ncbi.nlm.nih.gov/?term={keyword.replace(' ', '+')}"
    articles = []
    
    try:
        response = requests.get(search_url, timeout=10, headers=HEADERS)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Get first 3 article links
            for item in soup.select('.docsum-content')[:3]:
                link = item.find('a', href=True)
                if link:
                    article_url = f"https://pubmed.ncbi.nlm.nih.gov{link['href']}"

                    # Fetch individual article
                    article_resp = requests.get(article_url, timeout=10, headers=HEADERS)
                    if article_resp.status_code == 200:
                        article_soup = BeautifulSoup(article_resp.text, 'html.parser')
                        title_tag = article_soup.find('h1')
                        title = title_tag.text.strip() if title_tag else keyword

                        # Get abstract content
                        abstract_tag = article_soup.select_one('.abstract-content')
                        content = clean_text(abstract_tag.text) if abstract_tag else ''

                        if content:
                            articles.append({
                                'source': 'PubMed',
                                'title': title,
                                'content': content[:5000],  # Giới hạn độ dài
                                'url': article_url,
                                'last_updated': datetime.now()
                            })
    except Exception as e:
        print(f"PubMed fetch error: {e}")
    return articles

def synthesize_content(articles):
    """Combine content from multiple sources"""
    synthesized = {
        'introduction': '',
        'key_points': [],
        'sources': []
    }
    
    # Add Wikipedia content as introduction if available
    wiki_articles = [a for a in articles if a['source'] == 'Wikipedia']
    if wiki_articles:
        synthesized['introduction'] = wiki_articles[0]['content'][:5000]
        synthesized['sources'].append({
            'source': 'Wikipedia',
            'url': wiki_articles[0]['url']
        })
    
    # Add key points from scientific articles
    scientific_articles = [a for a in articles if a['source'] != 'Wikipedia']
    for article in scientific_articles:
        synthesized['key_points'].append({
            'source': article['source'],
            'title': article['title'],
            'content': article['content'][:5000],
            'url': article['url']
        })
        synthesized['sources'].append({
            'source': article['source'],
            'url': article['url']
        })
    
    return synthesized

def fetch_scientific_articles(keyword):
    """Main function to fetch and synthesize articles"""
    try:
        # Kiểm tra xem có bài viết gần đây không
        article = Article.objects.filter(keywords__icontains=keyword).order_by('-last_updated').first()
        if article and (datetime.now() - article.last_updated).days < 7:
            return json.loads(article.content)
    except Exception as e:
        print(f"Cache check error: {e}")
    
    articles = []

    # Fetch from all sources
    wiki_article = fetch_wikipedia_article(keyword)
    if wiki_article:
        articles.append(wiki_article)

    articles.extend(fetch_nature_articles(keyword))
    articles.extend(fetch_pubmed_articles(keyword))

    if not articles:  # Tránh lưu nếu không có dữ liệu
        print("No articles found")
        return None
    
    synthesized = synthesize_content(articles)

    # Tổng hợp nội dung từ introduction và key_points
    all_content = synthesized['introduction'] + " ".join([kp['content'] for kp in synthesized['key_points']])
    words = all_content.split()
    
    # Chỉ lấy 5000 từ cuối cùng
    content_trimmed = " ".join(words[-5000:])

    # Lấy danh sách URL của các nguồn
    source_urls = [src['url'] for src in synthesized['sources']]

    result = {
        'content': content_trimmed,
        'source_urls': source_urls
    }

    try:
        Article.objects.update_or_create(
            title=f"Scientific Overview: {keyword}",
            defaults={
                'keywords': json.dumps([keyword]),
                'content': json.dumps(result),  # Lưu nội dung đã lọc
                'source': 'Multiple',
                'url': f"internal:synthesis:{keyword}",
                'last_updated': datetime.now()
            }
        )
    except Exception as e:
        print(f"Database save error: {e}")

    return result

def fetch_from_url(url):
    """Fetch content from any given URL"""
    try:
        response = requests.get(url, timeout=10, headers=HEADERS)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Try to find the title - look for <h1>, <title>, etc.
            title_tag = soup.find('h1')
            if not title_tag:
                title_tag = soup.find('title')
            title = title_tag.text.strip() if title_tag else url
            
            # Remove unwanted elements (scripts, styles, navbars, etc.)
            for element in soup(['script', 'style', 'nav', 'footer', 'iframe', 'noscript']):
                element.decompose()
                
            # Get all paragraph texts
            content = ' '.join([clean_text(p.text) for p in soup.find_all('p') if p.text.strip()])
            
            # If no paragraphs found, try getting body text
            if not content:
                content = clean_text(soup.get_text())
            
            return {
                'source': 'Custom URL',
                'title': title,
                'content': content[:10000],  # More generous limit for general web pages
                'url': url,
                'last_updated': datetime.now()
            }
    except Exception as e:
        print(f"URL fetch error: {e}")
    return None
