import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime, timedelta
import os
import json

# List of URLs
urls = [
    "https://www.focumon.com/trainers/RitikBhardwaj",
    "https://www.focumon.com/trainers/shreyas",
    "https://www.focumon.com/trainers/akkubhosle1.html",
    "https://www.focumon.com/trainers/NamikazeMi_JoWH",
    "https://www.focumon.com/trainers/rabbitfoot",
    "https://www.focumon.com/trainers/Epic186_LmHD.html",
    "https://www.focumon.com/trainers/Dr4g0n_lQ3J",
    "https://www.focumon.com/trainers/bokuwa_tobi",
    "https://www.focumon.com/trainers/IndianB0nd_Dyz5.html",
    "https://www.focumon.com/trainers/ali_8Luq",
    "https://www.focumon.com/trainers/zix_",
    "https://www.focumon.com/trainers/saamm_qpme",
    "https://www.focumon.com/trainers/kuro_M3Cr",
    "https://www.focumon.com/trainers/bugbountyhunter.html",
    "https://www.focumon.com/trainers/Kheneh_V62t.html",
    "https://www.focumon.com/trainers/Cybershayk_e6yc",
    "https://www.focumon.com/trainers/anonymousp_jqMr",
    "https://www.focumon.com/trainers/nees"
]

def load_history():
    """Load historical rank data from history.json"""
    try:
        with open('history.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def save_history(history):
    """Save historical rank data to history.json"""
    with open('history.json', 'w') as f:
        json.dump(history, f, indent=2)

def update_history(history, current_ranks):
    """Update history with current ranks for today, and prune data older than 7 days"""
    today = datetime.now().date().isoformat()
    seven_days_ago = (datetime.now().date() - timedelta(days=7)).isoformat()
    
    for trainer_id, rank in current_ranks.items():
        if trainer_id not in history:
            history[trainer_id] = []
        # Remove any entry for today if exists (overwrite)
        history[trainer_id] = [entry for entry in history[trainer_id] if entry['date'] != today]
        history[trainer_id].append({'date': today, 'rank': rank})
        # Remove entries older than 7 days
        history[trainer_id] = [entry for entry in history[trainer_id] if entry['date'] >= seven_days_ago]
    return history

def get_rank_change(history, trainer_id):
    """Get the rank from 7 days ago for a trainer. Returns None if not available."""
    seven_days_ago = (datetime.now().date() - timedelta(days=7)).isoformat()
    if trainer_id not in history:
        return None
    for entry in history[trainer_id]:
        if entry['date'] == seven_days_ago:
            return entry['rank']
    return None

def extract_flowers_name_and_avatars(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract display name
        name_tag = soup.find('h1')
        display_name = name_tag.text.strip() if name_tag else "Unknown"
        
        # Find text containing "last 7 days"
        flowers = 0
        matches = soup.find_all(string=re.compile(r'last 7 days', re.I))
        for match in matches:
            num_match = re.search(r'\d+', match)
            if num_match:
                flowers = int(num_match.group())
                break
        
        # Extract trainer and focumon avatars
        avatar_container = soup.find('div', class_='flex gap-x-2 justify-center items-end mb-2 font-sans font-bold')
        trainer_avatar = None
        focumon_avatar = None
        
        if avatar_container:
            # Get trainer avatar
            trainer_div = avatar_container.find('div', class_='z-20')
            if trainer_div:
                trainer_img = trainer_div.find('img')
                if trainer_img and trainer_img.get('src'):
                    trainer_avatar = "https://www.focumon.com" + trainer_img['src'] if trainer_img['src'].startswith('/') else trainer_img['src']
            
            # Get focumon avatar
            focumon_div = avatar_container.find('div', class_='z-10')
            if focumon_div:
                focumon_img = focumon_div.find('img')
                if focumon_img and focumon_img.get('src'):
                    focumon_avatar = "https://www.focumon.com" + focumon_img['src'] if focumon_img['src'].startswith('/') else focumon_img['src']
        
        return display_name, flowers, trainer_avatar, focumon_avatar
    except Exception as e:
        print(f"Error fetching {url}: {str(e)}")
        return "Error", 0, None, None

def generate_top_three_html(data):
    """Generate HTML for the top three cards."""
    top_three_html = ""
    for i, (trainer_id, display_name, flowers, hours, trainer_avatar, focumon_avatar, rank_change) in enumerate(data[:3]):
        rank_class = f"rank-{i+1}"
        card_class = "first-place" if i == 0 else "second-place" if i == 1 else "third-place"
        
        trainer_img = f'<img src="{trainer_avatar}" class="trainer-avatar" alt="{display_name}">' if trainer_avatar else '<div class="trainer-avatar"></div>'
        focumon_img = f'<img src="{focumon_avatar}" class="focumon-avatar" alt="Focumon">' if focumon_avatar else '<div class="focumon-avatar"></div>'
        
        top_three_html += f"""
                <div class="podium-card {card_class}">
                    <div class="rank-badge {rank_class}">{i+1}</div>
                    <div class="avatar-container">
                        {trainer_img}
                        {focumon_img}
                    </div>
                    <div class="player-name">{display_name}</div>
                    <div class="player-stats">
                        <div class="stat">
                            <span class="stat-value">{flowers}</span>
                            <span class="stat-label">Flowers</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">{hours}</span>
                            <span class="stat-label">Hours</span>
                        </div>
                    </div>
                </div>
        """
    return top_three_html

def generate_table_rows_html(data):
    """Generate HTML for the table rows."""
    table_rows_html = ""
    for i, (trainer_id, display_name, flowers, hours, trainer_avatar, focumon_avatar, rank_change) in enumerate(data, start=1):
        progress_percent = (flowers / data[0][2]) * 100 if data[0][2] > 0 else 0
        
        if trainer_avatar:
            avatar_html = f'<img src="{trainer_avatar}" class="avatar" alt="{display_name}">'
        else:
            initial = display_name[0].upper() if display_name else '?'
            avatar_html = f'<div class="avatar-placeholder">{initial}</div>'

        # Determine rank change display
        if rank_change is None:
            change_html = '<span class="rank-change neutral">-</span>'
        else:
            if rank_change > 0:
                change_html = f'<span class="rank-change positive">▲ {abs(rank_change)}</span>'
            elif rank_change < 0:
                change_html = f'<span class="rank-change negative">▼ {abs(rank_change)}</span>'
            else:
                change_html = '<span class="rank-change neutral">-</span>'

        table_rows_html += f"""
                        <tr>
                            <td><div class="rank"><span class="table-rank">{i}</span></div></td>
                            <td>
                                <div class="player">
                                    {avatar_html}
                                    <div class="player-name-text">{display_name}</div>
                                </div>
                            </td>
                            <td>
                                <div class="flowers">{flowers}</div>
                                <div class="progress-bar">
                                    <div class="progress" style="width: {progress_percent}%"></div>
                                </div>
                            </td>
                            <td class="hours">{hours}</td>
                            <td class="rank-change">{change_html}</td>
                        </tr>
        """
    return table_rows_html

def main():
    # Load historical data
    history = load_history()
    
    # Collect current data
    data = []
    for url in urls:
        trainer_id = url.split('/')[-1].replace('.html', '')
        display_name, flowers, trainer_avatar, focumon_avatar = extract_flowers_name_and_avatars(url)
        # Calculate hours spent (1 flower = 20 minutes)
        hours_spent = round((flowers * 20) / 60, 2) if flowers else 0
        data.append((trainer_id, display_name, flowers, hours_spent, trainer_avatar, focumon_avatar))
        print(f"Processed {display_name}: {flowers} flowers, {hours_spent} hours")
    
    # Sort data by flowers to assign current ranks
    data.sort(key=lambda x: x[2], reverse=True)
    current_ranks = {}
    for idx, item in enumerate(data):
        trainer_id = item[0]
        current_ranks[trainer_id] = idx + 1  # 1-based rank
    
    # Update history with current ranks
    history = update_history(history, current_ranks)
    
    # Enhance data with rank change
    enhanced_data = []
    for item in data:
        trainer_id = item[0]
        previous_rank = get_rank_change(history, trainer_id)
        if previous_rank is None:
            rank_change = None
        else:
            rank_change = previous_rank - current_ranks[trainer_id]  # positive means improved
        enhanced_data.append(item + (rank_change,))
    
    # Save updated history
    save_history(history)
    
    # Calculate totals
    total_flowers = sum(player[2] for player in enhanced_data)
    total_hours = round(sum((player[2] * 20) / 60 for player in enhanced_data), 2)
    total_participants = len(enhanced_data)
    last_updated = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    # Generate HTML snippets
    top_three_html = generate_top_three_html(enhanced_data)
    table_rows_html = generate_table_rows_html(enhanced_data)
    
    # Read template
    with open('template.html', 'r') as f:
        template = f.read()
    
    # Replace placeholders
    html_content = template.replace('{{ top_three }}', top_three_html)
    html_content = html_content.replace('{{ table_rows }}', table_rows_html)
    html_content = html_content.replace('{{ total_participants }}', str(total_participants))
    html_content = html_content.replace('{{ total_flowers }}', str(total_flowers))
    html_content = html_content.replace('{{ total_hours }}', str(total_hours))
    html_content = html_content.replace('{{ last_updated }}', last_updated)
    
    # Write final HTML
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print("Leaderboard HTML generated successfully!")

if __name__ == "__main__":
    main()