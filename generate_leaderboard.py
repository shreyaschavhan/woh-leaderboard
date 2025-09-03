import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime
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

def generate_html_leaderboard(data):
    # Sort by flowers collected (descending order)
    data.sort(key=lambda x: x[2], reverse=True)
    
    # Calculate total flowers and hours
    total_flowers = sum(player[2] for player in data)
    total_hours = round(sum((player[2] * 20) / 60 for player in data), 2)
    
    # Generate HTML
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Consistency Leaderboard</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
      <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-4NJMY5MRXY"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());

        gtag('config', 'G-4NJMY5MRXY');
    </script>
        <style>
            :root {{
                --bg-dark-red: #3a0e0e;
                --card-red: #4a1e1e;
                --text-light: wheat;
                --text-muted: rgba(245, 222, 179, 0.7);
                --rank-gold: #FFD700;
                --rank-silver: #C0C0C0;
                --rank-bronze: #CD7F32;
                --shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                --transition: all 0.3s ease;
            }}

            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}

            body {{
                font-family: 'Poppins', sans-serif;
                background-color: var(--bg-dark-red);
                color: var(--text-light);
                min-height: 100vh;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
            }}

            .container {{
                width: 100%;
                max-width: 1200px;
                margin: 0 auto;
            }}

            header {{
                text-align: center;
                margin: 20px 0 40px;
                color: var(--text-light);
            }}

            .logo {{
                font-size: 3.5rem;
                margin-bottom: 10px;
                text-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            }}

            h1 {{
                font-size: 2.8rem;
                font-weight: 700;
                margin-bottom: 10px;
                text-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            }}

            .subtitle {{
                font-size: 1.2rem;
                font-weight: 300;
                max-width: 600px;
                margin: 0 auto;
                color: var(--text-muted);
            }}

            .top-three {{
                display: flex;
                justify-content: center;
                align-items: flex-end;
                gap: 20px;
                margin-bottom: 40px;
                flex-wrap: wrap;
            }}

            .podium-card {{
                background: var(--card-red);
                border-radius: 16px;
                box-shadow: var(--shadow);
                padding: 30px 20px;
                text-align: center;
                transition: var(--transition);
                display: flex;
                flex-direction: column;
                align-items: center;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }}

            .podium-card:hover {{
                transform: translateY(-10px);
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
            }}

            .second-place {{
                width: 280px;
                order: 1;
            }}

            .first-place {{
                width: 320px;
                order: 2;
                margin: 0 10px;
            }}

            .third-place {{
                width: 280px;
                order: 3;
            }}

            .rank-badge {{
                width: 45px;
                height: 45px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.4rem;
                font-weight: 700;
                margin: 0 auto 20px;
                color: #2c3e50;
                text-shadow: 0 1px 2px rgba(0,0,0,0.2);
            }}

            .rank-1 {{
                background-color: var(--rank-gold);
                width: 55px;
                height: 55px;
                font-size: 1.8rem;
            }}

            .rank-2 {{
                background-color: var(--rank-silver);
            }}

            .rank-3 {{
                background-color: var(--rank-bronze);
            }}

            .avatar-container {{
                display: flex;
                justify-content: center;
                align-items: flex-end;
                margin: 0 auto 20px;
                height: 130px; 
            }}

            .trainer-avatar, .focumon-avatar {{
                height: 128px;
                width: auto;
                object-fit: contain;
                image-rendering: -moz-crisp-edges;
                image-rendering: -webkit-crisp-edges;
                image-rendering: pixelated;
                image-rendering: crisp-edges;
            }}

            .focumon-avatar {{
                margin-left: -20px;
            }}

            .player-name {{
                font-size: 1.4rem;
                font-weight: 600;
                margin-bottom: 20px;
                color: var(--text-light);
            }}

            .first-place .player-name {{
                font-size: 1.6rem;
            }}

            .player-stats {{
                display: flex;
                justify-content: space-around;
                width: 100%;
            }}

            .stat {{
                display: flex;
                flex-direction: column;
            }}

            .stat-value {{
                font-size: 1.4rem;
                font-weight: 700;
                color: var(--text-light);
            }}
            
            .first-place .stat-value {{
                font-size: 1.6rem;
            }}

            .stat-label {{
                font-size: 0.9rem;
                color: var(--text-muted);
            }}

            .leaderboard-card {{
                background: var(--card-red);
                border-radius: 16px;
                box-shadow: var(--shadow);
                overflow: hidden;
                margin-bottom: 30px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }}

            .leaderboard-header {{
                background: #3a0e0e;
                color: var(--text-light);
                padding: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }}

            .leaderboard-title {{
                font-size: 1.5rem;
                font-weight: 600;
            }}

            .last-updated {{
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                color: var(--text-muted);
            }}

            .last-updated i {{
                margin-right: 8px;
            }}

            table {{
                width: 100%;
                border-collapse: collapse;
            }}

            th {{
                background-color: #5c2a2a;
                padding: 18px 15px;
                text-align: left;
                font-weight: 600;
                color: var(--text-light);
                border-bottom: 2px solid var(--bg-dark-red);
            }}

            th:nth-child(1) {{ width: 10%; }}
            th:nth-child(2) {{ width: 40%; }}
            th:nth-child(3) {{ width: 25%; }}
            th:nth-child(4) {{ width: 25%; }}

            td {{
                padding: 16px 15px;
                border-bottom: 1px solid #5c2a2a;
                transition: var(--transition);
                color: var(--text-light);
            }}

            tr:last-child td {{
                border-bottom: none;
            }}

            tr:hover td {{
                background-color: #5c2a2a;
            }}

            .rank {{
                font-weight: 700;
                text-align: center;
                display: flex;
                justify-content: center;
                align-items: center;
            }}

            .table-rank {{
                font-weight: 700;
                text-align: center;
                display: inline-block;
                width: 30px;
                height: 30px;
                line-height: 30px;
                border-radius: 50%;
                background-color: #3a0e0e;
                color: var(--text-light);
            }}
            
            /* MODIFIED: Styling for avatar images in the table */
            .avatar {{
                width: 45px;
                height: 45px;
                border-radius: 50%;
                margin-right: 15px;
                object-fit: cover;
                background-color: #3a0e0e; /* Fallback bg color */
                border: 2px solid #5c2a2a;
                image-rendering: pixelated;
            }}
            
            /* NEW: Styling for the placeholder if an image is missing */
            .avatar-placeholder {{
                width: 45px;
                height: 45px;
                border-radius: 50%;
                background: #5c2a2a;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--text-light);
                font-weight: 600;
                margin-right: 15px;
                font-size: 1.2rem;
            }}
            
            .player {{
                display: flex;
                align-items: center;
            }}

            .player-name-text {{
                font-weight: 500;
                color: var(--text-light);
            }}

            .flowers, .hours {{
                font-weight: 500;
                color: var(--text-light);
            }}

            .progress-bar {{
                height: 8px;
                background-color: #3a0e0e;
                border-radius: 4px;
                margin-top: 8px;
                overflow: hidden;
            }}

            .progress {{
                height: 100%;
                background: linear-gradient(to right, #ffd700, #f0c300);
                border-radius: 4px;
            }}

            .stats {{
                display: flex;
                justify-content: space-around;
                margin-top: 20px;
                flex-wrap: wrap;
            }}

            .stat-card {{
                background: var(--card-red);
                border-radius: 12px;
                padding: 20px;
                margin: 10px;
                flex: 1;
                min-width: 250px;
                box-shadow: var(--shadow);
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }}

            .stat-card i {{
                font-size: 2.5rem;
                margin-bottom: 15px;
                color: var(--rank-gold);
            }}

            .stat-card h3 {{
                font-size: 1.2rem;
                margin-bottom: 10px;
                color: var(--text-muted);
            }}

            .stat-card p {{
                font-size: 1.8rem;
                font-weight: 700;
                color: var(--text-light);
            }}

            footer {{
                text-align: center;
                margin-top: 40px;
                color: var(--text-muted);
                font-size: 0.9rem;
            }}

            @media (max-width: 900px) {{
                .top-three {{
                    flex-direction: column;
                    align-items: center;
                }}
                
                .first-place, .second-place, .third-place {{
                    width: 100%;
                    max-width: 400px;
                    margin: 10px 0;
                    order: unset;
                }}
            }}

            @media (max-width: 768px) {{
                th, td {{
                    padding: 12px 8px;
                }}
                
                .leaderboard-header {{
                    flex-direction: column;
                    text-align: center;
                    gap: 10px;
                }}
                
                .avatar, .avatar-placeholder {{
                    width: 35px;
                    height: 35px;
                    font-size: 1rem;
                }}
                
                h1 {{
                    font-size: 2.2rem;
                }}
                
                .subtitle {{
                    font-size: 1rem;
                }}
            }}

            @media (max-width: 576px) {{
                body {{
                    padding: 10px;
                }}
                
                th:nth-child(1), td:nth-child(1) {{
                    display: none;
                }}
                
                .stats {{
                    flex-direction: column;
                }}
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <div class="logo">
                    <i class="fas fa-leaf"></i>
                </div>
                <h1>Consistency Leaderboard</h1>
                <p class="subtitle">Track your progress and compete with other group member</p>
            </header>

            <div class="top-three">
    """
    
    # Generate top 3 cards
    for i, (trainer_id, display_name, flowers, hours, trainer_avatar, focumon_avatar) in enumerate(data[:3]):
        rank_class = f"rank-{i+1}"
        card_class = "first-place" if i == 0 else "second-place" if i == 1 else "third-place"
        
        trainer_img = f'<img src="{trainer_avatar}" class="trainer-avatar" alt="{display_name}">' if trainer_avatar else f'<div class="trainer-avatar"></div>'
        focumon_img = f'<img src="{focumon_avatar}" class="focumon-avatar" alt="Focumon">' if focumon_avatar else f'<div class="focumon-avatar"></div>'
        
        html_content += f"""
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
    
    html_content += f"""
            </div>

            <div class="leaderboard-card">
                <div class="leaderboard-header">
                    <div class="leaderboard-title">Other Participants</div>
                    <div class="last-updated">
                        <i class="fas fa-sync-alt"></i>
                        Updated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} UTC
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Player</th>
                            <th>Flowers Collected</th>
                            <th>Hours Spent</th>
                        </tr>
                    </thead>
                    <tbody>
    """
    
    # Generate table rows for remaining participants
    for i, (trainer_id, display_name, flowers, hours, trainer_avatar, focumon_avatar) in enumerate(data[3:], start=4):
        progress_percent = (flowers / data[0][2]) * 100 if data[0][2] > 0 else 0
        
        # MODIFIED: Use avatar image if available, otherwise use a placeholder with initials
        if trainer_avatar:
            avatar_html = f'<img src="{trainer_avatar}" class="avatar" alt="{display_name}">'
        else:
            initial = display_name[0].upper() if display_name else '?'
            avatar_html = f'<div class="avatar-placeholder">{initial}</div>'

        html_content += f"""
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
                        </tr>
        """
    
    html_content += f"""
                    </tbody>
                </table>
            </div>

            <div class="stats">
                <div class="stat-card">
                    <i class="fas fa-users"></i>
                    <h3>Total Participants</h3>
                    <p>{len(data)}</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-leaf"></i>
                    <h3>Total Flowers Collected</h3>
                    <p>{total_flowers}</p>
                </div>
                <div class="stat-card">
                    <i class="fas fa-clock"></i>
                    <h3>Total Hours Spent</h3>
                    <p>{total_hours}</p>
                </div>
            </div>

            <footer>
                <p>Leaderboard updates every 6 hours | Made with <i class="fas fa-heart" style="color: #e74c3c;"></i> for the Warriors of Hell community</p>
            </footer>
        </div>

        <script>
            // Add subtle animation to rows on load
            document.addEventListener('DOMContentLoaded', function() {{
                const cards = document.querySelectorAll('.podium-card');
                cards.forEach((card, index) => {{
                    card.style.opacity = 0;
                    card.style.transform = 'translateY(50px)';
                    setTimeout(() => {{
                        card.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
                        card.style.opacity = 1;
                        card.style.transform = 'translateY(0)';
                    }}, 300 * index);
                }});
                
                const rows = document.querySelectorAll('tbody tr');
                rows.forEach((row, index) => {{
                    row.style.opacity = 0;
                    row.style.transform = 'translateY(20px)';
                    setTimeout(() => {{
                        row.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                        row.style.opacity = 1;
                        row.style.transform = 'translateY(0)';
                    }}, 500 + (100 * index));
                }});
            }});
        </script>
    </body>
    </html>
    """
    
    return html_content

def main():
    # Collect data
    data = []
    for url in urls:
        trainer_id = url.split('/')[-1].replace('.html', '')
        display_name, flowers, trainer_avatar, focumon_avatar = extract_flowers_name_and_avatars(url)
        # Calculate hours spent (1 flower = 20 minutes)
        hours_spent = round((flowers * 20) / 60, 2) if flowers else 0
        data.append((trainer_id, display_name, flowers, hours_spent, trainer_avatar, focumon_avatar))
        print(f"Processed {display_name}: {flowers} flowers, {hours_spent} hours")
    
    # Generate HTML
    html_content = generate_html_leaderboard(data)
    
    # Write to file
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print("Leaderboard HTML generated successfully!")

if __name__ == "__main__":
    main()
