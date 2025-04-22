import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuration
// Replace with your Gemini API key
const AZURE_SPEECH_KEY = 'azure key'; // Replace with your Azure Speech key
const AZURE_SPEECH_REGION = 'eastus'; // Using US East region for English US

// DOM Elements
const interestInput = document.getElementById('interestInput');
const generateWordsBtn = document.getElementById('generateWordsBtn');
const wordText = document.getElementById('wordText');
const wordImage = document.getElementById('wordImage');
const pronounceBtn = document.getElementById('pronounceBtn');
const recordBtn = document.getElementById('recordBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const feedback = document.getElementById('feedback');

// State variables
let currentWords = [];
let currentIndex = 0;
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let showSummary = false;
let pronunciationScores = [];

// Initialize speech synthesis
const synth = window.speechSynthesis;

// Initialize Gemini
const genAI = new GoogleGenerativeAI("google_key");// Replace with your Google AI key
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Function to generate words using Gemini API
async function generateWords(topic) {
    try {
        console.log('Starting word generation for topic:', topic);
        
        const prompt = `Generate 10 words related to ${topic} that would be interesting for children to learn. Return only the words in a comma-separated list.`;
        console.log('Sending prompt to Gemini:', prompt);
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('Generated text:', text);
        
        if (!text) {
            throw new Error('No text generated');
        }
        
        const words = text.split(',').map(word => word.trim());
        console.log('Generated words:', words);
        
        if (words.length === 0) {
            throw new Error('No words generated');
        }
        
        // Generate image URLs for each word
        currentWords = await Promise.all(words.map(async (word) => {
            const imageUrl = await generateImageUrl(word);
            return { word, imageUrl };
        }));

        console.log('Final words with images:', currentWords);
        
        currentIndex = 0;
        updateWordDisplay();
    } catch (error) {
        console.error('Error generating words:', error);
        feedback.textContent = `Error generating words: ${error.message}. Please try again.`;
    }
}

// Function to generate image URL
async function generateImageUrl(word) {
    try {
        console.log('Generating image for word:', word);
        
        // Using a more reliable image source with proper URL structure
        const imageUrl = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(word)}+cartoon+child&client_id=hdeqTzQ7CMPO7Hhx-gc8Z9f1Fqt-2QUJF6BKeWmO7ds`;
        
        // Fetch the image data from Unsplash API
        const response = await fetch(imageUrl);
        const data = await response.json();
        
        if (data.urls && data.urls.regular) {
            const finalImageUrl = data.urls.regular;
            console.log('Generated image URL:', finalImageUrl);
            return finalImageUrl;
        } else {
            throw new Error('No image URL found in response');
        }
    } catch (error) {
        console.error('Error generating image:', error);
        // Return a reliable fallback image
        return `https://picsum.photos/300/300?random=${Math.random()}`;
    }
}

// Function to evaluate pronunciation using Azure Speech
async function evaluatePronunciation(audioBlob) {
    try {
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('word', currentWords[currentIndex].word);

        const response = await fetch(`https://${AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
                'Content-Type': 'audio/wav'
            },
            body: audioBlob
        });

        const result = await response.json();
        const recognizedText = result.DisplayText.toLowerCase();
        const targetWord = currentWords[currentIndex].word.toLowerCase();

        // Calculate a simple score based on recognition
        const score = recognizedText.includes(targetWord) ? 100 : 0;
        pronunciationScores[currentIndex] = score;

        if (recognizedText.includes(targetWord)) {
            const encouragingMessages = [
                "🌟 Great job! You said it perfectly!",
                "🎉 Wow! That was amazing!",
                "👏 Super star pronunciation!",
                "✨ You're getting better and better!",
                "💫 Perfect! Keep up the great work!"
            ];
            const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
            feedback.textContent = randomMessage;
            feedback.className = 'feedback correct';
        } else {
            const helpfulMessages = [
                "Let's try again! Listen carefully to the word.",
                "Almost there! Listen to the word one more time.",
                "You're getting closer! Practice makes perfect!",
                "Keep trying! You can do it!",
                "Let's practice together! Listen and repeat."
            ];
            const randomMessage = helpfulMessages[Math.floor(Math.random() * helpfulMessages.length)];
            feedback.textContent = randomMessage;
            feedback.className = 'feedback incorrect';
        }
    } catch (error) {
        console.error('Error evaluating pronunciation:', error);
        if (error.message.includes('No speech detected')) {
            feedback.textContent = 'No speech detected. Please try speaking louder.';
        } else if (error.message.includes('Azure Speech API error')) {
            feedback.textContent = 'Error connecting to speech service. Please check your internet connection.';
        } else {
            feedback.textContent = 'Error evaluating pronunciation. Please try again.';
        }
        feedback.className = 'feedback incorrect';
        pronunciationScores[currentIndex] = 0;
    }
}

// Function to update the word display
function updateWordDisplay() {
    if (currentWords.length === 0) return;
    
    const currentWord = currentWords[currentIndex];
    wordText.textContent = currentWord.word;
    wordImage.src = currentWord.imageUrl;
    updateProgress();
}

// Function to update progress
function updateProgress() {
    const progress = ((currentIndex + 1) / currentWords.length) * 100;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${currentIndex + 1}/${currentWords.length}`;
}

// Function to pronounce the current word
function pronounceWord() {
    const utterance = new SpeechSynthesisUtterance(currentWords[currentIndex].word);
    utterance.rate = 0.8;
    utterance.pitch = 1.2;
    synth.speak(utterance);
}

// Function to start recording
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            await evaluatePronunciation(audioBlob);
        };

        mediaRecorder.start();
        isRecording = true;
        recordBtn.textContent = 'Stop Recording';
    } catch (error) {
        console.error('Error starting recording:', error);
        feedback.textContent = 'Error accessing microphone. Please check permissions.';
    }
}

// Function to stop recording
function stopRecording() {
    mediaRecorder.stop();
    isRecording = false;
    recordBtn.textContent = 'Record';
}

// Add new function to show summary page
function showPronunciationSummary() {
    const container = document.querySelector('.container');
    
    // Find words that need more practice (score < 100)
    const wordsToPractice = currentWords
        .map((word, index) => ({
            word: word.word,
            score: pronunciationScores[index] || 0
        }))
        .sort((a, b) => a.score - b.score);

    container.innerHTML = `
        <header>
            <h1>Pronunciation Assessment Summary</h1>
        </header>
        <main class="summary-page">
            <div class="summary-content">
                <h2>🎉 Great Job! 🎉</h2>
                <p>You've completed all the words!</p>
                <div class="summary-stats">
                    <p>Words Practiced: ${currentWords.length}</p>
                    <div class="practice-words">
                        <h3>Your Pronunciation Results:</h3>
                        <ul>
                            ${wordsToPractice.map(item => `
                                <li class="word-score ${item.score === 0 ? 'no-attempt' : item.score === 100 ? 'perfect' : 'needs-practice'}">
                                    ${item.word}
                                    <span class="score-indicator">
                                        ${item.score === 0 ? '❌ Not Attempted' : 
                                          item.score === 100 ? '✅ Perfect' : '⚠️ Needs Practice'}
                                    </span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
                <button id="restartBtn" class="generate-btn">Practice More Words</button>
            </div>
        </main>
    `;

    // Add event listener for restart button
    document.getElementById('restartBtn').addEventListener('click', () => {
        location.reload();
    });
}

// Event Listeners
generateWordsBtn.addEventListener('click', () => {
    const topic = interestInput.value.trim();
    if (topic) {
        generateWords(topic);
    } else {
        feedback.textContent = 'Please enter a topic first!';
    }
});

pronounceBtn.addEventListener('click', pronounceWord);

recordBtn.addEventListener('click', () => {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
});

prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        updateWordDisplay();
    }
});

nextBtn.addEventListener('click', () => {
    if (currentIndex < currentWords.length - 1) {
        currentIndex++;
        updateWordDisplay();
    } else if (!showSummary) {
        showSummary = true;
        showPronunciationSummary();
    }
}); 