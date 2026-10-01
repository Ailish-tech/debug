// ================================================================
//  DEAD MAN'S DEBUG — AI Challenge Bank
//  Curated C debugging challenges for the AI agent
//  Each challenge has buggy code, expected output, and hints
// ================================================================

const round1Pool = [
  {
    title: "The Broken Counter",
    description: "This program should calculate the sum of numbers from 1 to 5 (which is 15). Find and fix the bug.",
    buggyCode: `#include <stdio.h>
int main() {
    int n = 5, sum = 0;
    for (int i = 1; i < n; i++) {
        sum += i;
    }
    printf("Sum = %d\\n", sum);
    return 0;
}`,
    difficulty: "easy",
    errorType: "Off-by-one error",
    testCases: [{ input: "", expectedOutput: "Sum = 15" }],
    hints: ["Look at the loop condition carefully", "Should i stop before n or at n?"]
  },
  {
    title: "The Cursed Factorial",
    description: "This program should calculate the factorial of 5 (which is 120). Find and fix the bug.",
    buggyCode: `#include <stdio.h>
int main() {
    int n = 5;
    int fact = 0;
    for (int i = 1; i <= n; i++) {
        fact *= i;
    }
    printf("Factorial = %d\\n", fact);
    return 0;
}`,
    difficulty: "easy",
    errorType: "Wrong initialization",
    testCases: [{ input: "", expectedOutput: "Factorial = 120" }],
    hints: ["What happens when you multiply anything by zero?", "Check the initial value of fact"]
  },
  {
    title: "The Sunken Maximum",
    description: "This program should find and print the maximum value in the array {3, 7, 2, 9, 5}. The answer should be 9.",
    buggyCode: `#include <stdio.h>
int main() {
    int arr[] = {3, 7, 2, 9, 5};
    int max = arr[0];
    for (int i = 1; i < 5; i++) {
        if (arr[i] < max) {
            max = arr[i];
        }
    }
    printf("Maximum = %d\\n", max);
    return 0;
}`,
    difficulty: "easy",
    errorType: "Wrong comparison operator",
    testCases: [{ input: "", expectedOutput: "Maximum = 9" }],
    hints: ["To find the maximum, which direction should you compare?", "Check the comparison operator in the if statement"]
  },
  {
    title: "The Failed Swap",
    description: "This program should swap two numbers: a=5 and b=10, so a becomes 10 and b becomes 5.",
    buggyCode: `#include <stdio.h>
int main() {
    int a = 5, b = 10;
    int temp = a;
    a = b;
    b = a;
    printf("a = %d, b = %d\\n", a, b);
    return 0;
}`,
    difficulty: "easy",
    errorType: "Logic error",
    testCases: [{ input: "", expectedOutput: "a = 10, b = 5" }],
    hints: ["After assigning b to a, what value does a hold?", "What should b be assigned to complete the swap?"]
  },
  {
    title: "The Wrong Power",
    description: "This program should calculate 2 raised to the power 5 (which is 32).",
    buggyCode: `#include <stdio.h>
int main() {
    int base = 2, exp = 5;
    int result = 0;
    for (int i = 0; i < exp; i++) {
        result *= base;
    }
    printf("%d^%d = %d\\n", base, exp, result);
    return 0;
}`,
    difficulty: "easy",
    errorType: "Wrong initialization",
    testCases: [{ input: "", expectedOutput: "2^5 = 32" }],
    hints: ["What is the multiplicative identity?", "What happens when result starts at 0?"]
  },
  {
    title: "The Confused Palindrome",
    description: "This program should check if 12321 is a palindrome (it is). Fix the reversal logic.",
    buggyCode: `#include <stdio.h>
int main() {
    int n = 12321, original = n, reversed = 0;
    while (n > 0) {
        reversed = reversed + n % 10;
        n /= 10;
    }
    if (original == reversed)
        printf("%d is a palindrome\\n", original);
    else
        printf("%d is not a palindrome\\n", original);
    return 0;
}`,
    difficulty: "moderate",
    errorType: "Missing arithmetic operation",
    testCases: [{ input: "", expectedOutput: "12321 is a palindrome" }],
    hints: ["How do you build a number digit by digit?", "Before adding the new digit, what should you do to reversed?"]
  },
  {
    title: "The Imposter Prime",
    description: "This program should determine that 17 is a prime number. Currently it says every number is not prime.",
    buggyCode: `#include <stdio.h>
int main() {
    int n = 17, isPrime = 1;
    for (int i = 2; i <= n; i++) {
        if (n % i == 0) {
            isPrime = 0;
            break;
        }
    }
    if (isPrime)
        printf("%d is prime\\n", n);
    else
        printf("%d is not prime\\n", n);
    return 0;
}`,
    difficulty: "moderate",
    errorType: "Loop bound error",
    testCases: [{ input: "", expectedOutput: "17 is prime" }],
    hints: ["Every number is divisible by itself", "The loop should stop before reaching n"]
  },
  {
    title: "The Scrambled Fibonacci",
    description: "Print the first 7 Fibonacci numbers: 0 1 1 2 3 5 8",
    buggyCode: `#include <stdio.h>
int main() {
    int n = 7, a = 0, b = 1, next;
    printf("%d %d", a, b);
    for (int i = 2; i < n; i++) {
        next = a + b;
        a = next;
        b = next;
        printf(" %d", next);
    }
    printf("\\n");
    return 0;
}`,
    difficulty: "moderate",
    errorType: "Wrong assignment order",
    testCases: [{ input: "", expectedOutput: "0 1 1 2 3 5 8" }],
    hints: ["After calculating next, which variable should get the old value of b?", "The order of assignments matters"]
  },
  {
    title: "The Backward Digits",
    description: "This program should count the number of digits in 12345 (which is 5). It currently gives the wrong count.",
    buggyCode: `#include <stdio.h>
int main() {
    int n = 12345, count = 1;
    while (n > 0) {
        count++;
        n = n / 10;
    }
    printf("Digits: %d\\n", count);
    return 0;
}`,
    difficulty: "easy",
    errorType: "Off-by-one initialization",
    testCases: [{ input: "", expectedOutput: "Digits: 5" }],
    hints: ["What should count start at?", "Trace through: how many times does the loop run for 12345?"]
  },
  {
    title: "The Frozen Temperature",
    description: "Convert 100 degrees Celsius to Fahrenheit. The formula is F = (C * 9/5) + 32. Answer should be 212.00.",
    buggyCode: `#include <stdio.h>
int main() {
    float celsius = 100.0;
    float fahrenheit = (celsius * 5 / 9) + 32;
    printf("%.2f C = %.2f F\\n", celsius, fahrenheit);
    return 0;
}`,
    difficulty: "easy",
    errorType: "Wrong formula",
    testCases: [{ input: "", expectedOutput: "100.00 C = 212.00 F" }],
    hints: ["Check the Celsius to Fahrenheit formula", "Is it 5/9 or 9/5?"]
  },
  {
    title: "The Lost Sum of Digits",
    description: "This program should calculate the sum of digits of 9876 (which is 9+8+7+6 = 30).",
    buggyCode: `#include <stdio.h>
int main() {
    int n = 9876, sum = 0;
    while (n > 0) {
        sum += n / 10;
        n = n % 10;
    }
    printf("Sum of digits = %d\\n", sum);
    return 0;
}`,
    difficulty: "moderate",
    errorType: "Swapped operations",
    testCases: [{ input: "", expectedOutput: "Sum of digits = 30" }],
    hints: ["Which operation extracts the last digit: / or %?", "Which operation removes the last digit?"]
  },
  {
    title: "The Misguided Multiplication Table",
    description: "Print the multiplication table of 7 from 7x1 to 7x5.",
    buggyCode: `#include <stdio.h>
int main() {
    int n = 7;
    for (int i = 0; i < 5; i++) {
        printf("%d x %d = %d\\n", n, i, n * i);
    }
    return 0;
}`,
    difficulty: "easy",
    errorType: "Off-by-one in loop",
    testCases: [{ input: "", expectedOutput: "7 x 1 = 7\n7 x 2 = 14\n7 x 3 = 21\n7 x 4 = 28\n7 x 5 = 35" }],
    hints: ["Multiplication tables start from 1, not 0", "Check both the start value and end condition of the loop"]
  },
  {
    title: "The Vanishing Array Sum",
    description: "This program should print the sum of array elements {10, 20, 30, 40, 50}, which is 150.",
    buggyCode: `#include <stdio.h>
int main() {
    int arr[] = {10, 20, 30, 40, 50};
    int sum = 0;
    for (int i = 0; i <= 5; i++) {
        sum += arr[i];
    }
    printf("Sum = %d\\n", sum);
    return 0;
}`,
    difficulty: "easy",
    errorType: "Array bounds error",
    testCases: [{ input: "", expectedOutput: "Sum = 150" }],
    hints: ["An array of 5 elements has indices 0 to 4", "Check the loop's upper bound"]
  },
  {
    title: "The Even/Odd Mixup",
    description: "This program should check whether 7 is even or odd. 7 is odd.",
    buggyCode: `#include <stdio.h>
int main() {
    int n = 7;
    if (n % 2 = 0) {
        printf("%d is even\\n", n);
    } else {
        printf("%d is odd\\n", n);
    }
    return 0;
}`,
    difficulty: "easy",
    errorType: "Assignment vs comparison operator",
    testCases: [{ input: "", expectedOutput: "7 is odd" }],
    hints: ["There is a difference between = and ==", "One assigns, the other compares"]
  },
  {
    title: "The Reverse Number Riddle",
    description: "This program should reverse the number 1234 to get 4321.",
    buggyCode: `#include <stdio.h>
int main() {
    int n = 1234, reversed = 0;
    while (n > 0) {
        int digit = n % 10;
        reversed = reversed + digit;
        n /= 10;
    }
    printf("Reversed = %d\\n", reversed);
    return 0;
}`,
    difficulty: "moderate",
    errorType: "Missing place value shift",
    testCases: [{ input: "", expectedOutput: "Reversed = 4321" }],
    hints: ["Just adding digits won't build a number", "Before adding the digit, shift reversed left by one place"]
  }
];

const round2Pool = [
  {
    title: "The Cursed Bubble Sort",
    description: "This bubble sort should sort the array {64, 34, 25, 12, 22} in ascending order. Fix all the bugs to get: 12 22 25 34 64",
    buggyCode: `#include <stdio.h>
int main() {
    int arr[] = {64, 34, 25, 12, 22};
    int n = 5;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n - 1; j++) {
            if (arr[j] < arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    for (int i = 0; i < n; i++) {
        if (i > 0) printf(" ");
        printf("%d", arr[i]);
    }
    printf("\\n");
    return 0;
}`,
    difficulty: "moderate",
    errorType: "Wrong comparison + optimization bug",
    testCases: [{ input: "", expectedOutput: "12 22 25 34 64" }],
    hints: ["For ascending sort, which element should move right?", "The comparison operator determines sort direction"]
  },
  {
    title: "The Broken Binary Search",
    description: "This binary search should find element 23 in the sorted array {2, 5, 8, 12, 16, 23, 38, 56, 72, 91} and print 'Found at index 5'.",
    buggyCode: `#include <stdio.h>
int main() {
    int arr[] = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    int n = 10, target = 23;
    int low = 0, high = n, mid;
    int found = -1;
    while (low < high) {
        mid = (low + high) / 2;
        if (arr[mid] == target) {
            found = mid;
            break;
        } else if (arr[mid] < target) {
            low = mid;
        } else {
            high = mid;
        }
    }
    if (found != -1)
        printf("Found at index %d\\n", found);
    else
        printf("Not found\\n");
    return 0;
}`,
    difficulty: "hard",
    errorType: "Multiple bugs: bounds + infinite loop",
    testCases: [{ input: "", expectedOutput: "Found at index 5" }],
    hints: ["high should be n-1 for valid array indexing", "low = mid can cause an infinite loop — what should it be?", "The while condition might need to include equals"]
  },
  {
    title: "The Corrupted Selection Sort",
    description: "Sort the array {29, 10, 14, 37, 13} in ascending order using selection sort. Output: 10 13 14 29 37",
    buggyCode: `#include <stdio.h>
int main() {
    int arr[] = {29, 10, 14, 37, 13};
    int n = 5;
    for (int i = 0; i < n - 1; i++) {
        int minIdx = 0;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] > arr[minIdx]) {
                minIdx = j;
            }
        }
        int temp = arr[i];
        arr[i] = arr[minIdx];
        arr[minIdx] = temp;
    }
    for (int i = 0; i < n; i++) {
        if (i > 0) printf(" ");
        printf("%d", arr[i]);
    }
    printf("\\n");
    return 0;
}`,
    difficulty: "moderate",
    errorType: "Multiple bugs: wrong init + wrong comparison",
    testCases: [{ input: "", expectedOutput: "10 13 14 29 37" }],
    hints: ["Where should minIdx start in each outer iteration?", "To sort ascending, should you find the minimum or maximum?"]
  },
  {
    title: "The Shattered String Reverse",
    description: "Reverse the string 'PIRATE' to get 'ETARIP'.",
    buggyCode: `#include <stdio.h>
#include <string.h>
int main() {
    char str[] = "PIRATE";
    int len = strlen(str);
    for (int i = 0; i < len; i++) {
        char temp = str[i];
        str[i] = str[len - i];
        str[len - i] = temp;
    }
    printf("%s\\n", str);
    return 0;
}`,
    difficulty: "moderate",
    errorType: "Multiple bugs: loop range + off-by-one indexing",
    testCases: [{ input: "", expectedOutput: "ETARIP" }],
    hints: ["Swapping the full length swaps back again — only go halfway", "str[len] is the null terminator, not the last character", "Use len - 1 - i for the mirror index"]
  },
  {
    title: "The Riddled GCD",
    description: "Calculate the GCD of 48 and 18 using the Euclidean subtraction method. The answer is 6.",
    buggyCode: `#include <stdio.h>
int main() {
    int a = 48, b = 18;
    while (a != b) {
        if (a > b)
            a = a - b;
        else
            b = a - b;
    }
    printf("GCD = %d\\n", a);
    return 0;
}`,
    difficulty: "moderate",
    errorType: "Wrong subtraction order",
    testCases: [{ input: "", expectedOutput: "GCD = 6" }],
    hints: ["In the else branch, which variable should be subtracted from which?", "b should decrease, not potentially go negative"]
  },
  {
    title: "The Haunted Matrix Addition",
    description: "Add two 2x2 matrices: A={{1,2},{3,4}} and B={{5,6},{7,8}}. Result should be {{6,8},{10,12}}.",
    buggyCode: `#include <stdio.h>
int main() {
    int a[2][2] = {{1, 2}, {3, 4}};
    int b[2][2] = {{5, 6}, {7, 8}};
    int c[2][2];
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 2; j++) {
            c[i][j] = a[i][j] + b[j][i];
        }
    }
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 2; j++) {
            if (j > 0) printf(" ");
            printf("%d", c[i][j]);
        }
        printf("\\n");
    }
    return 0;
}`,
    difficulty: "moderate",
    errorType: "Transposed indices in addition",
    testCases: [{ input: "", expectedOutput: "6 8\n10 12" }],
    hints: ["Both matrices should use the same row and column indices", "Check the indices used for matrix b"]
  },
  {
    title: "The Phantom Pattern",
    description: "Print a right-angled triangle pattern with 4 rows using asterisks. Each row i should have i stars.",
    buggyCode: `#include <stdio.h>
int main() {
    int n = 4;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) {
            printf("*");
        }
        printf("\\n");
    }
    return 0;
}`,
    difficulty: "easy",
    errorType: "Wrong loop bound in inner loop",
    testCases: [{ input: "", expectedOutput: "*\n**\n***\n****" }],
    hints: ["The inner loop prints the same number of stars on every row", "How many stars should row i have?"]
  },
  {
    title: "The Doomed Array Rotation",
    description: "Left-rotate the array {1, 2, 3, 4, 5} by 2 positions. Expected: 3 4 5 1 2",
    buggyCode: `#include <stdio.h>
int main() {
    int arr[] = {1, 2, 3, 4, 5};
    int n = 5, d = 2;
    int temp[5];
    for (int i = 0; i < n; i++) {
        temp[i] = arr[i + d];
    }
    for (int i = 0; i < n; i++) {
        arr[i] = temp[i];
    }
    for (int i = 0; i < n; i++) {
        if (i > 0) printf(" ");
        printf("%d", arr[i]);
    }
    printf("\\n");
    return 0;
}`,
    difficulty: "hard",
    errorType: "Missing modulo wraparound",
    testCases: [{ input: "", expectedOutput: "3 4 5 1 2" }],
    hints: ["When i + d exceeds n, the index goes out of bounds", "Use the modulo operator to wrap around"]
  },
  {
    title: "The Wrecked Word Counter",
    description: "Count the number of words in 'The sea is rough today'. Expected output: 5 words.",
    buggyCode: `#include <stdio.h>
int main() {
    char str[] = "The sea is rough today";
    int count = 0, i = 0;
    while (str[i] != '\\0') {
        if (str[i] == ' ') {
            count++;
        }
        i++;
    }
    printf("Words: %d\\n", count);
    return 0;
}`,
    difficulty: "moderate",
    errorType: "Fence-post error",
    testCases: [{ input: "", expectedOutput: "Words: 5" }],
    hints: ["Counting spaces gives the number of gaps between words", "How is the number of words related to the number of spaces?"]
  },
  {
    title: "The Plundered Second Largest",
    description: "Find the second largest element in the array {12, 35, 1, 10, 34, 1}. Answer is 34.",
    buggyCode: `#include <stdio.h>
int main() {
    int arr[] = {12, 35, 1, 10, 34, 1};
    int n = 6;
    int first = 0, second = 0;
    for (int i = 0; i < n; i++) {
        if (arr[i] > first) {
            first = arr[i];
        } else if (arr[i] > second) {
            second = arr[i];
        }
    }
    printf("Second largest = %d\\n", second);
    return 0;
}`,
    difficulty: "hard",
    errorType: "Missing cascading update",
    testCases: [{ input: "", expectedOutput: "Second largest = 34" }],
    hints: ["When a new first is found, the old first becomes the second", "You need to update second before updating first"]
  },
  {
    title: "The Sinking Armstrong Check",
    description: "Check if 153 is an Armstrong number (1^3 + 5^3 + 3^3 = 153). It is!",
    buggyCode: `#include <stdio.h>
int main() {
    int n = 153, original = n, sum = 0;
    while (n > 0) {
        int digit = n % 10;
        sum += digit * digit;
        n /= 10;
    }
    if (sum == original)
        printf("%d is an Armstrong number\\n", original);
    else
        printf("%d is not an Armstrong number\\n", original);
    return 0;
}`,
    difficulty: "moderate",
    errorType: "Wrong power calculation",
    testCases: [{ input: "", expectedOutput: "153 is an Armstrong number" }],
    hints: ["An Armstrong number uses cubes, not squares", "153 has 3 digits, so each digit is raised to the power 3"]
  },
  {
    title: "The Marooned Remove Duplicates",
    description: "Remove duplicates from the sorted array {1, 1, 2, 3, 3, 4, 5, 5} and print unique elements: 1 2 3 4 5",
    buggyCode: `#include <stdio.h>
int main() {
    int arr[] = {1, 1, 2, 3, 3, 4, 5, 5};
    int n = 8;
    int j = 0;
    for (int i = 0; i < n; i++) {
        if (arr[i] != arr[i + 1]) {
            arr[j] = arr[i];
            j++;
        }
    }
    for (int i = 0; i < j; i++) {
        if (i > 0) printf(" ");
        printf("%d", arr[i]);
    }
    printf("\\n");
    return 0;
}`,
    difficulty: "hard",
    errorType: "Out-of-bounds comparison + lost last element",
    testCases: [{ input: "", expectedOutput: "1 2 3 4 5" }],
    hints: ["When i is the last index, arr[i+1] is out of bounds", "Compare each element with the previous one instead, or adjust the loop range"]
  },
  {
    title: "The Capsized Matrix Transpose",
    description: "Transpose a 3x3 matrix {{1,2,3},{4,5,6},{7,8,9}} and print the result row by row.",
    buggyCode: `#include <stdio.h>
int main() {
    int mat[3][3] = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 3; j++) {
            int temp = mat[i][j];
            mat[i][j] = mat[j][i];
            mat[j][i] = temp;
        }
    }
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 3; j++) {
            if (j > 0) printf(" ");
            printf("%d", mat[i][j]);
        }
        printf("\\n");
    }
    return 0;
}`,
    difficulty: "hard",
    errorType: "Double-swap: transposing entire matrix swaps back",
    testCases: [{ input: "", expectedOutput: "1 4 7\n2 5 8\n3 6 9" }],
    hints: ["If you swap (i,j) with (j,i) for ALL pairs, each pair gets swapped twice", "Only swap elements above the diagonal: j should start from i+1"]
  },
  {
    title: "The Sabotaged Star Pyramid",
    description: "Print a centered pyramid of stars with 4 rows. Each row has (2*i - 1) stars centered with spaces.",
    buggyCode: `#include <stdio.h>
int main() {
    int n = 4;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n - i; j++) {
            printf(" ");
        }
        for (int j = 1; j < 2 * i; j++) {
            printf("*");
        }
        printf("\\n");
    }
    return 0;
}`,
    difficulty: "moderate",
    errorType: "Off-by-one in star count",
    testCases: [{ input: "", expectedOutput: "   *\n  ***\n *****\n*******" }],
    hints: ["Row i should have exactly (2*i - 1) stars", "Check whether the inner loop condition gives enough stars"]
  },
  {
    title: "The Wrecked Number Pyramid",
    description: "Print a number pyramid with 5 rows where each row i prints the number i repeatedly i times.",
    buggyCode: `#include <stdio.h>
int main() {
    int n = 5;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) {
            printf("%d", j);
        }
        printf("\\n");
    }
    return 0;
}`,
    difficulty: "easy",
    errorType: "Wrong variable printed",
    testCases: [{ input: "", expectedOutput: "1\n22\n333\n4444\n55555" }],
    hints: ["Each row should print the row number, not the column number", "Which variable represents the current row?"]
  }
];

// ============ AI AGENT: CHALLENGE GENERATOR ============

/**
 * The AI Agent selects challenges from the curated bank,
 * shuffles them, and returns the requested number for each round.
 */
function generateChallenges(round, count) {
  const pool = round === 1 ? [...round1Pool] : [...round2Pool];

  // Shuffle using Fisher-Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const selected = pool.slice(0, Math.min(count, pool.length));

  return selected.map(ch => ({
    title: ch.title,
    description: ch.description,
    buggyCode: ch.buggyCode,
    language: 'c',
    testCases: ch.testCases,
    difficulty: ch.difficulty,
    round: round,
    hints: ch.hints || [],
    timeLimit: 15,
    errorType: ch.errorType
  }));
}

function getPoolSize(round) {
  return round === 1 ? round1Pool.length : round2Pool.length;
}

module.exports = { generateChallenges, getPoolSize };
