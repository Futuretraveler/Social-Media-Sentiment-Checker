// Tab switching functionality
function switchTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab content
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// Single text analysis
async function analyzeSingle() {
    const text = document.getElementById('single-text').value.trim();
    
    if (!text) {
        alert('Please enter some text to analyze.');
        return;
    }
    
    // Show loading state
    const resultSection = document.getElementById('single-result');
    resultSection.classList.remove('hidden');
    
    // Preserve the structure but show loading
    const sentimentDisplay = document.getElementById('single-sentiment-display');
    const scoresDiv = document.getElementById('single-scores');
    
    if (sentimentDisplay) {
        sentimentDisplay.innerHTML = '<div class="loading">Analyzing sentiment...</div>';
    }
    if (scoresDiv) {
        scoresDiv.innerHTML = '';
    }
    
    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            displaySingleResult(result);
        } else {
            throw new Error(result.error || 'Analysis failed');
        }
    } catch (error) {
        const sentimentDisplay = document.getElementById('single-sentiment-display');
        if (sentimentDisplay) {
            sentimentDisplay.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        }
    }
}

// Display single analysis result
function displaySingleResult(result) {
    const resultSection = document.getElementById('single-result');
    const sentimentDisplay = document.getElementById('single-sentiment-display');
    const scoresDiv = document.getElementById('single-scores');
    
    // Determine sentiment icon
    let icon = '😐';
    if (result.sentiment === 'positive') icon = '😊';
    else if (result.sentiment === 'negative') icon = '😞';
    
    // Create sentiment display
    sentimentDisplay.innerHTML = `
        <div class="sentiment-display ${result.sentiment}">
            <span class="sentiment-icon">${icon}</span>
            <div>
                <div>Sentiment: <strong>${result.sentiment.charAt(0).toUpperCase() + result.sentiment.slice(1)}</strong></div>
                <div>Confidence: ${(result.confidence * 100).toFixed(1)}%</div>
                <div class="confidence-bar">
                    <div class="confidence-fill ${result.sentiment}" style="width: ${result.confidence * 100}%"></div>
                </div>
            </div>
        </div>
    `;
    
    // Create scores display
    scoresDiv.innerHTML = `
        <div class="scores-grid">
            <div class="score-item">
                <div class="score-label">Positive Score</div>
                <div class="score-value">${(result.scores.pos * 100).toFixed(1)}%</div>
            </div>
            <div class="score-item">
                <div class="score-label">Negative Score</div>
                <div class="score-value">${(result.scores.neg * 100).toFixed(1)}%</div>
            </div>
            <div class="score-item">
                <div class="score-label">Neutral Score</div>
                <div class="score-value">${(result.scores.neu * 100).toFixed(1)}%</div>
            </div>
            <div class="score-item">
                <div class="score-label">Compound Score</div>
                <div class="score-value">${result.scores.compound.toFixed(3)}</div>
            </div>
        </div>
    `;
}

// Batch analysis
async function analyzeBatch() {
    const textArea = document.getElementById('batch-texts');
    const texts = textArea.value.trim().split('\n').filter(text => text.trim() !== '');
    
    if (texts.length === 0) {
        alert('Please enter some texts to analyze (one per line).');
        return;
    }
    
    if (texts.length > 100) {
        alert('Please limit to 100 texts or fewer for batch analysis.');
        return;
    }
    
    // Show loading state
    const resultSection = document.getElementById('batch-result');
    resultSection.classList.remove('hidden');
    resultSection.innerHTML = '<div class="loading">Analyzing batch...</div>';
    
    try {
        const response = await fetch('/batch-analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ texts: texts })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            displayBatchResult(result);
        } else {
            throw new Error(result.error || 'Batch analysis failed');
        }
    } catch (error) {
        resultSection.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}

// Display batch analysis result
function displayBatchResult(result) {
    const resultSection = document.getElementById('batch-result');
    const summaryDiv = document.getElementById('batch-summary');
    const detailsDiv = document.getElementById('batch-details');
    
    // Create summary display
    const summary = result.summary;
    summaryDiv.innerHTML = `
        <h4>Summary</h4>
        <div class="summary-stats">
            <div class="stat-item">
                <div class="stat-value">${summary.total_texts}</div>
                <div class="stat-label">Total Texts</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${summary.sentiment_distribution.positive}</div>
                <div class="stat-label">Positive</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${summary.sentiment_distribution.negative}</div>
                <div class="stat-label">Negative</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${summary.sentiment_distribution.neutral}</div>
                <div class="stat-label">Neutral</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${(summary.average_confidence * 100).toFixed(1)}%</div>
                <div class="stat-label">Avg Confidence</div>
            </div>
        </div>
    `;
    
    // Create details display
    detailsDiv.innerHTML = '<h4>Individual Results</h4>';
    result.results.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = `batch-item ${item.sentiment}`;
        
        let icon = '😐';
        if (item.sentiment === 'positive') icon = '😊';
        else if (item.sentiment === 'negative') icon = '😞';
        
        itemDiv.innerHTML = `
            <div class="batch-text">"${item.processed_text || 'No text'}"</div>
            <div>
                <span class="batch-sentiment ${item.sentiment}">${icon} ${item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1)}</span>
                <span style="margin-left: 10px; color: #666;">Confidence: ${(item.confidence * 100).toFixed(1)}%</span>
            </div>
        `;
        
        detailsDiv.appendChild(itemDiv);
    });
}

// Add keyboard shortcuts
document.addEventListener('DOMContentLoaded', function() {
    // Enter key to analyze in single text mode
    document.getElementById('single-text').addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            analyzeSingle();
        }
    });
    
    // Enter key to analyze in batch mode
    document.getElementById('batch-texts').addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            analyzeBatch();
        }
    });
    
    // Add some example texts for testing
    document.getElementById('single-text').addEventListener('focus', function() {
        if (!this.value) {
            this.placeholder = 'Try: "I love this product! 😍 It\'s amazing!"';
        }
    });
    
    document.getElementById('batch-texts').addEventListener('focus', function() {
        if (!this.value) {
            this.placeholder = 'Enter multiple texts, one per line...\nExample:\nI love this!\nThis is terrible!\nThe weather is nice.';
        }
    });
}); 