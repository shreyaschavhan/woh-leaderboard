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

def extract_flowers_and_name(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract display name
        name_tag = soup.find('h1')
        display_name = name_tag.text.strip() if name_tag else "Unknown"
        
        # Find text containing "last 7 days"
        matches = soup.find_all(string=re.compile(r'last 7 days', re.I))
        for match in matches:
            num_match = re.search(r'\d+', match)
            if num_match:
                return display_name, int(num_match.group())
        
        return display_name, 0
    except Exception as e:
        print(f"Error fetching {url}: {str(e)}")
        return "Error", 0

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
        <style>
            :root {{
                --primary: #4CAF50;
                --primary-light: #80e27e;
                --secondary: #ff6d00;
                --accent: #ffab40;
                --dark: #2c3e50;
                --light: #ecf0f1;
                --gray: #95a5a6;
                --white: #ffffff;
                --card-bg: rgba(255, 255, 255, 0.95);
                --shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                --transition: all 0.3s ease;
            }}

            * {{
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }}

            body {{
                font-family: 'Poppins', sans-serif;
                background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
                background-size: 400% 400%;
                animation: gradientBG 15s ease infinite;
                color: var(--dark);
                min-height: 100vh;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
            }}

            @keyframes gradientBG {{
                0% {{ background-position: 0% 50%; }}
                50% {{ background-position: 100% 50%; }}
                100% {{ background-position: 0% 50%; }}
            }}

            .container {{
                width: 100%;
                max-width: 1200px;
                margin: 0 auto;
            }}

            header {{
                text-align: center;
                margin: 20px 0 40px;
                color: var(--white);
            }}

            .logo {{
                font-size: 3.5rem;
                margin-bottom: 10px;
                color: var(--white);
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
                opacity: 0.9;
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
                background: var(--card-bg);
                border-radius: 16px;
                box-shadow: var(--shadow);
                padding: 25px;
                text-align: center;
                transition: var(--transition);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
            }}

            .podium-card:hover {{
                transform: translateY(-10px);
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            }}

            .second-place {{
                width: 250px;
                order: 1;
            }}

            .first-place {{
                width: 300px;
                order: 2;
                margin: 0 10px;
            }}

            .third-place {{
                width: 250px;
                order: 3;
            }}

            .rank-badge {{
                width: 60px;
                height: 60px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                font-weight: 700;
                margin: 0 auto 15px;
                color: var(--white);
            }}

            .rank-1 {{
                background: linear-gradient(to right, #FFD700, #FFA500);
                box-shadow: 0 4px 15px rgba(255, 215, 0, 0.5);
                width: 80px;
                height: 80px;
                font-size: 2rem;
            }}

            .rank-2 {{
                background: linear-gradient(to right, #C0C0C0, #A9A9A9);
                box-shadow: 0 4px 15px rgba(192, 192, 192, 0.5);
            }}

            .rank-3 {{
                background: linear-gradient(to right, #CD7F32, #8C6B46);
                box-shadow: 0 4px 15px rgba(205, 127, 50, 0.5);
            }}

            .player-avatar {{
                width: 100px;
                height: 100px;
                border-radius: 50%;
                background: linear-gradient(to right, var(--primary), var(--primary-light));
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--white);
                font-weight: 600;
                margin: 0 auto 15px;
                font-size: 2.5rem;
            }}

            .first-place .player-avatar {{
                width: 120px;
                height: 120px;
                font-size: 3rem;
            }}

            .player-name {{
                font-size: 1.4rem;
                font-weight: 600;
                margin-bottom: 10px;
                color: var(--dark);
            }}

            .first-place .player-name {{
                font-size: 1.6rem;
            }}

            .player-stats {{
                display: flex;
                justify-content: space-around;
                margin-top: 15px;
            }}

            .stat {{
                display: flex;
                flex-direction: column;
            }}

            .stat-value {{
                font-size: 1.4rem;
                font-weight: 700;
            }}

            .first-place .stat-value {{
                font-size: 1.6rem;
            }}

            .stat-label {{
                font-size: 0.9rem;
                color: var(--gray);
            }}

            .flowers-stat {{
                color: var(--primary);
            }}

            .hours-stat {{
                color: var(--secondary);
            }}

            .leaderboard-card {{
                background: var(--card-bg);
                border-radius: 16px;
                box-shadow: var(--shadow);
                overflow: hidden;
                margin-bottom: 30px;
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
            }}

            .leaderboard-header {{
                background: linear-gradient(to right, var(--primary), var(--primary-light));
                color: var(--white);
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
            }}

            .last-updated i {{
                margin-right: 8px;
            }}

            table {{
                width: 100%;
                border-collapse: collapse;
            }}

            th {{
                background-color: #f5f5f5;
                padding: 18px 15px;
                text-align: left;
                font-weight: 600;
                color: var(--dark);
                border-bottom: 2px solid #e0e0e0;
            }}

            th:nth-child(1) {{ width: 10%; }}
            th:nth-child(2) {{ width: 40%; }}
            th:nth-child(3) {{ width: 25%; }}
            th:nth-child(4) {{ width: 25%; }}

            td {{
                padding: 16px 15px;
                border-bottom: 1px solid #e0e0e0;
                transition: var(--transition);
            }}

            tr:hover td {{
                background-color: #f9f9f9;
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
                background-color: #f0f0f0;
            }}

            .table-rank-4, .table-rank-5, .table-rank-6 {{
                background: linear-gradient(to right, #6c5ce7, #a29bfe);
                color: white;
            }}

            .player {{
                display: flex;
                align-items: center;
            }}

            .avatar {{
                width: 45px;
                height: 45px;
                border-radius: 50%;
                background: linear-gradient(to right, var(--primary), var(--primary-light));
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--white);
                font-weight: 600;
                margin-right: 15px;
                font-size: 1.2rem;
            }}

            .player-name {{
                font-weight: 500;
            }}

            .flowers, .hours {{
                font-weight: 500;
            }}

            .flowers {{
                color: var(--primary);
            }}

            .hours {{
                color: var(--secondary);
            }}

            .progress-bar {{
                height: 8px;
                background-color: #e0e0e0;
                border-radius: 4px;
                margin-top: 8px;
                overflow: hidden;
            }}

            .progress {{
                height: 100%;
                background: linear-gradient(to right, var(--primary), var(--primary-light));
                border-radius: 4px;
            }}

            .stats {{
                display: flex;
                justify-content: space-around;
                margin-top: 20px;
                flex-wrap: wrap;
            }}

            .stat-card {{
                background: var(--card-bg);
                border-radius: 12px;
                padding: 20px;
                margin: 10px;
                flex: 1;
                min-width: 250px;
                box-shadow: var(--shadow);
                text-align: center;
            }}

            .stat-card i {{
                font-size: 2.5rem;
                margin-bottom: 15px;
                color: var(--primary);
            }}

            .stat-card h3 {{
                font-size: 1.2rem;
                margin-bottom: 10px;
                color: var(--dark);
            }}

            .stat-card p {{
                font-size: 1.8rem;
                font-weight: 700;
                color: var(--secondary);
            }}

            footer {{
                text-align: center;
                margin-top: 40px;
                color: var(--white);
                font-size: 0.9rem;
                opacity: 0.8;
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
                
                .avatar {{
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
                <h1>Flower Collection Leaderboard</h1>
                <p class="subtitle">Track your progress and compete with other trainers in flower collection</p>
            </header>

            <div class="top-three">
    """
    
    # Generate top 3 cards
    for i, (trainer_id, display_name, flowers, hours) in enumerate(data[:3]):
        rank_class = f"rank-{i+1}"
        card_class = "first-place" if i == 0 else "second-place" if i == 1 else "third-place"
        initials = ''.join([name[0] for name in display_name.split()[:2]]).upper()
        
        html_content += f"""
                <div class="podium-card {card_class}">
                    <div class="rank-badge {rank_class}">{i+1}</div>
                    <div class="player-avatar">{initials}</div>
                    <div class="player-name">{display_name}</div>
                    <div class="player-stats">
                        <div class="stat">
                            <span class="stat-value flowers-stat">{flowers}</span>
                            <span class="stat-label">Flowers</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value hours-stat">{hours}</span>
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
    for i, (trainer_id, display_name, flowers, hours) in enumerate(data[3:], start=4):
        initials = ''.join([name[0] for name in display_name.split()[:2]]).upper()
        progress_percent = (flowers / data[0][2]) * 100 if data[0][2] > 0 else 0
        
        html_content += f"""
                        <tr>
                            <td><div class="rank"><span class="table-rank table-rank-{i}">{i}</span></div></td>
                            <td>
                                <div class="player">
                                    <div class="avatar">{initials}</div>
                                    <div class="player-name">{display_name}</div>
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
                    <i class="fas fa-flower"></i>
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
                <p>Leaderboard updates every 6 hours | Made with <i class="fas fa-heart" style="color: #e74c3c;"></i> for the Focumon community</p>
            </footer>
        </div>

        <script>
            // Update the time displayed
            function updateTime() {{
                const now = new Date();
                const options = {{ 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit', 
                    minute: '2-digit' 
                }};
                document.querySelector('.last-updated').textContent = 'Updated: ' + now.toLocaleDateString('en-US', options) + ' UTC';
            }}
            
            // Initialize
            updateTime();
            
            // Update time every minute
            setInterval(updateTime, 60000);
            
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
        display_name, flowers = extract_flowers_and_name(url)
        # Calculate hours spent (1 flower = 20 minutes)
        hours_spent = round((flowers * 20) / 60, 2) if flowers else 0
        data.append((trainer_id, display_name, flowers, hours_spent))
    
    # Generate HTML
    html_content = generate_html_leaderboard(data)
    
    # Write to file
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print("Leaderboard HTML generated successfully!")

if __name__ == "__main__":
    main()
