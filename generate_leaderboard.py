import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime, timedelta
import os
import json
import math

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
    "https://www.focumon.com/trainers/anonymousp_jqMr",
    "https://www.focumon.com/trainers/nees",
    "https://www.focumon.com/trainers/Hafiz_hGGm",
    "https://www.focumon.com/trainers/t3po",
    "https://www.focumon.com/trainers/Elden_lord_xY0b",
    "https://www.focumon.com/trainers/bhvrvt",
    "https://www.focumon.com/trainers/Ivoclib009_xBCe",
    "https://www.focumon.com/trainers/chaithu_QmSm",
    "https://www.focumon.com/trainers/SShbounty_cbhK",
    "https://www.focumon.com/trainers/Shubham_Kh_V9WH",
    "https://www.focumon.com/trainers/uday",
    "https://focumon.com/trainers/Momehrust_l0E4",
    "https://www.focumon.com/trainers/Srishti_QuOP"
]

def load_history():
    """Load historical data from history_current.json, or fallback to history.json for migration"""
    try:
        with open('history_current.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        try:
            with open('history.json', 'r') as f:
                history = json.load(f)
                # Migrate to new file name
                with open('history_current.json', 'w') as f2:
                    json.dump(history, f2, indent=2)
                return history
        except FileNotFoundError:
            return {}

def save_history(history):
    """Save historical data to history_current.json"""
    with open('history_current.json', 'w') as f:
        json.dump(history, f, indent=2)

def update_history(history, current_dict):
    """Update history with current flowers and rank for today, and move data older than 90 days to yearly archive files"""
    today = datetime.now().date().isoformat()
    ninety_days_ago = (datetime.now().date() - timedelta(days=90)).isoformat()
    
    # First, update the current history with today's data
    for trainer_id, data in current_dict.items():
        flowers = data['flowers']
        rank = data['rank']
        if trainer_id not in history:
            history[trainer_id] = []
        # Remove any entry for today if exists (overwrite)
        history[trainer_id] = [entry for entry in history[trainer_id] if entry['date'] != today]
        history[trainer_id].append({'date': today, 'rank': rank, 'flowers': flowers})
    
    # Now, remove entries older than 90 days from current history and add them to archive
    archive_entries = {}  # key: year, value: dict of trainer_id to list of entries for that year
    for trainer_id, entries in history.items():
        keep_entries = []
        for entry in entries:
            if entry['date'] >= ninety_days_ago:
                keep_entries.append(entry)
            else:
                # This entry is old, so add to archive
                year = entry['date'][:4]  # extract year from date string
                if year not in archive_entries:
                    archive_entries[year] = {}
                if trainer_id not in archive_entries[year]:
                    archive_entries[year][trainer_id] = []
                archive_entries[year][trainer_id].append(entry)
        history[trainer_id] = keep_entries
    
    # For each year in archive_entries, load the corresponding archive file, merge entries, and save
    for year, year_data in archive_entries.items():
        archive_filename = f"history_{year}.json"
        if os.path.exists(archive_filename):
            with open(archive_filename, 'r') as f:
                archive_history = json.load(f)
        else:
            archive_history = {}
        
        for trainer_id, entries in year_data.items():
            if trainer_id not in archive_history:
                archive_history[trainer_id] = []
            # Avoid duplicates by checking dates
            existing_dates = {entry['date'] for entry in archive_history[trainer_id]}
            for entry in entries:
                if entry['date'] not in existing_dates:
                    archive_history[trainer_id].append(entry)
            # Sort entries by date for consistency
            archive_history[trainer_id].sort(key=lambda x: x['date'])
        
        with open(archive_filename, 'w') as f:
            json.dump(archive_history, f, indent=2)
    
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

def get_title(history_entries):
    """Assign a title based on the last 7 days of flower data."""
    if not history_entries:
        return "Newcomer"
    
    # Sort entries by date and get entries with flowers
    sorted_entries = sorted(history_entries, key=lambda x: x['date'])
    # Only consider entries that have 'flowers' key
    valid_entries = [entry for entry in sorted_entries if 'flowers' in entry]
    if len(valid_entries) < 7:
        return "Newcomer"
    
    flowers_list = [entry['flowers'] for entry in valid_entries][-7:]
    # Calculate average of first 6 days and compare to last day
    avg_old = sum(flowers_list[:-1]) / 6
    last_day = flowers_list[-1]
    
    if last_day > avg_old * 1.5:
        return "Rising Star"
    elif last_day < avg_old * 0.5:
        return "Slumping"
    else:
        mean = sum(flowers_list) / 7
        if mean < 75:
            return "Average"
        variance = sum((x - mean) ** 2 for x in flowers_list) / 7
        std_dev = math.sqrt(variance)
        coeff_var = std_dev / mean
        if coeff_var < 0.1:
            return "Consistent Performer"
        else:
            return "Average"

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
    for i, (trainer_id, display_name, flowers, hours, trainer_avatar, focumon_avatar, rank_change, title) in enumerate(data[:3]):
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
                    <div class="player-title">{title}</div>
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
    for i, (trainer_id, display_name, flowers, hours, trainer_avatar, focumon_avatar, rank_change, title) in enumerate(data, start=1):
        progress_percent = (flowers / data[0][2]) * 100 if data[0][2] > 0 else 0
        is_danger_zone = flowers < 75
        
        if trainer_avatar:
            avatar_html = f'<img src="{trainer_avatar}" class="avatar" alt="{display_name}">'
        else:
            initial = display_name[0].upper() if display_name else '?'
            avatar_html = f'<div class="avatar-placeholder">{initial}</div>'

        if rank_change is None:
            change_html = '<span class="rank-change neutral">-</span>'
        else:
            if rank_change > 0:
                change_html = f'<span class="rank-change positive">▲ {abs(rank_change)}</span>'
            elif rank_change < 0:
                change_html = f'<span class="rank-change negative">▼ {abs(rank_change)}</span>'
            else:
                change_html = '<span class="rank-change neutral">-</span>'

        row_class = 'class="danger-zone"' if is_danger_zone else ''
        
        # Make the entire row clickable
        table_rows_html += f"""
                        <tr {row_class} onclick="window.location.href='users/user_{trainer_id}.html';" style="cursor: pointer;">
                            <td><div class="rank"><span class="table-rank">{i}</span></div></td>
                            <td>
                                <div class="player">
                                    {avatar_html}
                                    <div>
                                        <div class="player-name-text">{display_name}</div>
                                        <div class="player-title">{title}</div>
                                    </div>
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

def get_user_history(trainer_id):
    """Load all historical data for a given trainer from current and yearly files."""
    history = []
    # Load from current history file
    try:
        with open('history_current.json', 'r') as f:
            current_data = json.load(f)
            if trainer_id in current_data:
                history.extend(current_data[trainer_id])
    except FileNotFoundError:
        pass
    except json.JSONDecodeError:
        pass
    
    # Find all yearly files
    yearly_files = []
    for filename in os.listdir('.'):
        if filename.startswith('history_') and filename.endswith('.json'):
            yearly_files.append(filename)
    
    for filename in yearly_files:
        try:
            with open(filename, 'r') as f:
                yearly_data = json.load(f)
                if trainer_id in yearly_data:
                    # Add entries from yearly file
                    history.extend(yearly_data[trainer_id])
        except (FileNotFoundError, json.JSONDecodeError):
            continue
    
    # Sort by date
    history.sort(key=lambda x: x['date'])
    return history

def generate_user_dashboards(data):
    """Generate dashboard HTML pages for each user in data."""
    # Load the user template
    try:
        with open('user_template.html', 'r', encoding='utf-8') as f:
            template = f.read()
    except FileNotFoundError:
        print("Error: user_template.html not found. Cannot generate dashboards.")
        return

    # Create users directory if it doesn't exist
    if not os.path.exists('users'):
        os.makedirs('users')

    for item in data:
        trainer_id = item[0]
        display_name = item[1]
        # Get all history for this user
        user_history = get_user_history(trainer_id)
        if not user_history:
            continue
        
        # Prepare data for graphs: dates, flowers, ranks
        # Use defensive programming to handle missing keys
        dates = []
        flowers = []
        ranks = []
        for entry in user_history:
            # Only include entries that have a date
            if 'date' in entry:
                dates.append(entry['date'])
                flowers.append(entry.get('flowers', 0))  # default to 0 if missing
                ranks.append(entry.get('rank', 0))       # default to 0 if missing
        
        # Convert to JSON for JavaScript usage
        dates_json = json.dumps(dates)
        flowers_json = json.dumps(flowers)
        ranks_json = json.dumps(ranks)
        
        # Replace placeholders in the template
        html_content = template.replace('{{ display_name }}', display_name)
        html_content = html_content.replace('{{ dates }}', dates_json)
        html_content = html_content.replace('{{ flowers }}', flowers_json)
        html_content = html_content.replace('{{ ranks }}', ranks_json)
        
        # Write to file in users folder
        filename = f"user_{trainer_id}.html"
        filepath = os.path.join('users', filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html_content)
        print(f"Generated dashboard for {display_name} in users folder")

def main():
    # Load historical data
    history = load_history()
    
    # Collect current data
    data = []
    for url in urls:
        trainer_id = url.split('/')[-1].replace('.html', '')
        display_name, flowers, trainer_avatar, focumon_avatar = extract_flowers_name_and_avatars(url)
        hours_spent = round((flowers * 20) / 60, 2) if flowers else 0
        data.append((trainer_id, display_name, flowers, hours_spent, trainer_avatar, focumon_avatar))
        print(f"Processed {display_name}: {flowers} flowers, {hours_spent} hours")
    
    # Sort data by flowers to assign current ranks
    data.sort(key=lambda x: x[2], reverse=True)
    current_dict = {}
    for idx, item in enumerate(data):
        trainer_id = item[0]
        flowers = item[2]
        current_dict[trainer_id] = {'flowers': flowers, 'rank': idx + 1}
    
    # Update history with current data
    history = update_history(history, current_dict)
    
    # Enhance data with rank change and title
    enhanced_data = []
    for item in data:
        trainer_id = item[0]
        previous_rank = get_rank_change(history, trainer_id)
        if previous_rank is None:
            rank_change = None
        else:
            current_rank = current_dict[trainer_id]['rank']
            rank_change = previous_rank - current_rank  # positive means improved
        
        # Get title from flower history
        hist_entries = history.get(trainer_id, [])
        title = get_title(hist_entries)
        
        enhanced_data.append(item + (rank_change, title))
    
    # Save updated history
    save_history(history)
    
    # Generate user dashboards
    generate_user_dashboards(enhanced_data)
    
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
