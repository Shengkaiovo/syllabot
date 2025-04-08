import openai
import azure.cognitiveservices.speech as speechsdk

openai.api_key = "key here"
speech_key = "KEY!!!!!!!!" #need key
service_region = "en_US"

def generate_words_from_interest(interest, n=5, age = 6):
    prompt = f"Suggest {n} fun and useful English words or phrases for someone in {age} interested in {interest} to learn."
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    message = response['choices'][0]['message']['content']
    return [line.strip("- ").strip() for line in message.split("\n") if line.strip()]


def speak_text(text):
    speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=service_region)
    audio_config = speechsdk.audio.AudioOutputConfig(use_default_speaker=True)

    #change the voice
    speech_config.speech_synthesis_voice_name = "en-US-AriaNeural"  # You can use other neural voices

    synthesizer = speechsdk.SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)
    result = synthesizer.speak_text_async(text).get()

    if result.reason != speechsdk.ResultReason.SynthesizingAudioCompleted:
        print("❌ Error in text-to-speech:", result.reason)


def assess_pronunciation(reference_text):
    print(f"\n📢 Please say: \"{reference_text}\"")

    # Configure speech recognizer
    speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=service_region)
    audio_config = speechsdk.audio.AudioConfig(use_default_microphone=True)
    recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

    pron_config = speechsdk.PronunciationAssessmentConfig(
        reference_text=reference_text,
        grading_system=speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
        granularity=speechsdk.PronunciationAssessmentGranularity.Phoneme,
        enable_miscue=True
    )
    pron_config.apply_to(recognizer)

    print("🎧 Playing correct pronunciation...")
    speak_text(reference_text)

    input("🎤 Press Enter and then read the sentence into the mic...")

    print("🕒 Listening...")
    result = recognizer.recognize_once()

    if result.reason == speechsdk.ResultReason.RecognizedSpeech:
        print(f"\n✅ Recognized: {result.text}")
        pron_result = speechsdk.PronunciationAssessmentResult(result)
        print("📊 Pronunciation Score:")
        print(f"  Accuracy Score: {pron_result.accuracy_score}")
        print(f"  Fluency Score: {pron_result.fluency_score}")
        print(f"  Completeness Score: {pron_result.completeness_score}")
        print("🔎 Word-level feedback:")
        for word in pron_result.words:
            print(f"  Word: {word.word}, Accuracy: {word.accuracy_score}, Error Type: {word.error_type}")
    else:
        print("❌ Speech Recognition failed:", result.reason)

def main():
    interest = input("🤖 What are you interested in learning words about? (e.g., cooking, space, animals): ")
    words = generate_words_from_interest(interest)
    print("\n✨ Here are some words/phrases you can practice:")
    for idx, word in enumerate(words, start=1):
        print(f"  {idx}. {word}")

    choice = int(input("\n🔍 Enter the number of the word you'd like to practice: ")) - 1
    selected_phrase = words[choice]
    assess_pronunciation(selected_phrase)


if __name__ == "__main__":
    main()
