#include <Servo.h>

Servo earL;
Servo earR;
Servo armL;
Servo armR;

int earL_pin = 2;
int earR_pin = 3;
int armL_pin = 4;
int armR_pin = 5;


void setup() {
  Serial.begin(9600);

  earL.attach(earL_pin);
  earR.attach(earR_pin);
  armL.attach(armL_pin);
  armR.attach(armR_pin);
}

void loop() {
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    if (command == "CORRECT") {
      doCorrectDance(earL, earR, armL, armR);
    }
    else if (command == "INCORRECT") {
      doIncorrectDance(earL, earR, armL, armR);
    }
    else if (command == "WAVE_TWO") {
      doTwoArmWave(armL, armR);
    }
    else if (command == "WAVE_ONE") {
      doOneArmWave(armL, armR);
    }
    else if (command == "DANCE") {
      doDanceArms(armL, armR);
    }
    else if (command == "THINKING") {
      doThinkingDance(earL, earR, armL, armR);
    }
  }
}


void doCorrectDance(leftEarServo, rightEarServo, leftArmServo, rightArmServo) {
  i = 0;

  while (1 < 3) {
    leftEarServo.write(25);
    rightEarServo.write(25);
    leftArmServo.write(90);
    rightArmServo.write(90);
    delay(250);
    leftEarServo.write(75);
    rightEarServo.write(75);
    leftArmServo.write(0);
    rightArmServo.write(180);
    delay(250);
    i+=1;
  }

  resetBody(leftEarServo, rightEarServo, leftArmServo, rightArmServo);
  
}

void doIncorrectDance(leftEarServo, rightEarServo, leftArmServo, rightArmServo) {

  for (i = 0; i < 90; i++)
    leftEarServo.write(90-i);
    rightEarServo.write(90-i);
    leftArmServo.write(90-i);
    rightArmServo.write(90+i);
  }

  resetBody(leftEarServo, rightEarServo, leftArmServo, rightArmServo);
  
}

void resetBody(leftEarServo, rightEarServo, leftArmServo, rightArmServo) {
  leftEarServo.write(90);
  rightEarServo.write(90);
  leftArmServo.write(90);
  rightArmServo.write(90);
}



