const QUESTIONS_PER_BLOCK = 10; // ⭐️ CORRIGIDO: const em minúsculo
// A lista de perguntas original carregada do JSON
let originalQuestions = [];
// A nova lista de perguntas, embaralhada e usada no Quiz
let shuffledQuestions = [];
let currentBlock = 0;
let totalHits = 0;
let totalErrors = 0;
let userAnswers = {}; // { questionId: { isCorrect: bool, selectedIndex: number }, ... }

const quizContent = document.getElementById('quiz-content');
const navigationArea = document.getElementById('navigation-area');
const resultsArea = document.getElementById('results-area');
const nextButton = document.getElementById('next-button');
const backButton = document.getElementById('back-button');
const finishButton = document.getElementById('finish-button');

// ⭐️ AJUSTADO: Array de mensagens estendido (11 motivacionais + 1 final)
const motivationMessages = [
    // Índice 0 (Bloco 1)
    "Parabéns pelo primeiro bloco! Você domina os conceitos básicos. Mantenha o foco, a excelência está logo ali!",
    // Índice 1 (Bloco 2)
    "Impressionante! A segunda etapa concluída com sucesso. Cada acerto é um passo mais perto da proficiência total. Continue com essa determinação!",
    // Índice 2 (Bloco 3)
    "Você está no ritmo certo! Passar da metade do caminho com essa performance é digno de nota. Continue assim!",
    // Índice 3 (Bloco 4)
    "Quarto bloco concluído! Sua concentração e conhecimento estão afiados. Não perca o embalo!",
    // Índice 4 (Bloco 5)
    "Excelente! O quinto bloco é seu. A proficiência se constrói passo a passo, e você está construindo uma base sólida.",
    // Índice 5 (Bloco 6)
    "Metade do Quiz! O desafio está aumentando, mas sua dedicação também. Foco total para a segunda metade!",
    // Índice 6 (Bloco 7)
    "Sétimo bloco vencido! Sua jornada de aprendizado está chegando ao fim. Mantenha a energia alta!",
    // Índice 7 (Bloco 8)
    "Uau! O oitavo bloco foi superado. Lembre-se, cada pergunta é uma oportunidade de dominar o Pacote Office.",
    // Índice 8 (Bloco 9)
    "Reta final! Faltam poucos blocos para completar o desafio. Use todo o seu conhecimento acumulado!",
    // Índice 9 (Bloco 10)
    "Penúltimo bloco concluído! Você demonstrou uma resiliência incrível. Respire fundo e prepare-se para o último!",
    // Índice 10 (Bloco 11)
    "Bloco 11 concluído! Praticamente no fim. Sua consistência é a chave para o sucesso.",
    // Índice 11 (Final)
    "Fim de jogo! Você chegou ao final do quiz. Sua persistência e dedicação são a chave para o domínio do Pacote Office. Orgulhe-se do seu esforço!"
];

// --- FUNÇÃO DE ALEATORIEDADE ---

// Função auxiliar para embaralhar um array (Algoritmo Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 1. Carregar as perguntas
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        originalQuestions = await response.json();
        startQuiz();
    } catch (error) {
        quizContent.innerHTML = "<p>Erro ao carregar as perguntas. Verifique o arquivo 'questions.json' e se você está usando um servidor local.</p>";
        console.error("Erro ao carregar questions.json:", error);
    }
}

// 2. Iniciar o Quiz
function startQuiz() {
    shuffledQuestions = [...originalQuestions]; 
    shuffleArray(shuffledQuestions);

    currentBlock = 0;
    totalHits = 0;
    totalErrors = 0;
    userAnswers = {};
    renderBlock();
    navigationArea.style.display = 'flex'; 
}

// 3. Renderizar o bloco atual
function renderBlock() {
    const startIdx = currentBlock * QUESTIONS_PER_BLOCK;
    const endIdx = startIdx + QUESTIONS_PER_BLOCK;
    const blockQuestions = shuffledQuestions.slice(startIdx, endIdx);

    quizContent.innerHTML = '';
    resultsArea.style.display = 'none';

    blockQuestions.forEach((q, index) => {
        const globalIndex = startIdx + index + 1;

        let qWithOptions = { ...q };
        if (qWithOptions.options.length < 5) {
            qWithOptions.options = [...q.options];
            qWithOptions.options.push({
                text: "Nenhuma das alternativas",
                isCorrect: false,
                rationale: "Esta opção não corresponde a nenhuma das alternativas corretas."
            });
        }

        const questionHtml = createQuestionHtml(qWithOptions, globalIndex);
        quizContent.appendChild(questionHtml);
    });

    updateNavigationButtons();
}

// 4. Criar HTML da pergunta
function createQuestionHtml(question, globalIndex) {
    const qBlock = document.createElement('div');
    qBlock.className = 'question-block';
    qBlock.dataset.id = question.id;

    const formattedNumber = String(globalIndex).padStart(2, '0');

    const qText = document.createElement('p');
    qText.className = 'question-text';
    qText.textContent = `${formattedNumber}. ${question.question}`;
    qBlock.appendChild(qText);

    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'answer-options';

    const letters = ['A', 'B', 'C', 'D', 'E'];

    question.options.forEach((option, index) => {
        const optionWrapper = document.createElement('div');
        optionWrapper.className = 'option-wrapper';

        const optionButton = document.createElement('button');
        optionButton.textContent = `${letters[index]}) ${option.text}`;
        optionButton.dataset.correct = option.isCorrect;
        optionButton.dataset.index = index;
        optionButton.dataset.rationale = option.rationale;
        optionButton.onclick = (e) => handleAnswer(e.target, question.id, index);

        optionWrapper.appendChild(optionButton);
        optionsDiv.appendChild(optionWrapper);
    });

    qBlock.appendChild(optionsDiv);

    if (userAnswers[question.id] !== undefined) {
        showFeedback(qBlock, userAnswers[question.id].isCorrect, userAnswers[question.id].selectedIndex);
    }

    return qBlock;
}

// 5. Lidar com a resposta
function handleAnswer(selectedButton, questionId, selectedIndex) {
    const qBlock = selectedButton.closest('.question-block');
    const isCorrect = selectedButton.dataset.correct === 'true';

    userAnswers[questionId] = {
        isCorrect: isCorrect,
        selectedIndex: selectedIndex
    };

    showFeedback(qBlock, isCorrect, selectedIndex);

    qBlock.querySelectorAll('button').forEach(btn => btn.disabled = true);

    checkBlockCompletion();
}

// 6. Mostrar feedback visual e explicação
function showFeedback(qBlock, isCorrect, selectedIndex) {
    const buttons = qBlock.querySelectorAll('button');
    let correctRationale = '';

    buttons.forEach(btn => {
        btn.disabled = true;
        const isCurrentCorrect = btn.dataset.correct === 'true';
        const isCurrentlySelected = parseInt(btn.dataset.index) === selectedIndex;

        if (isCurrentCorrect) {
            btn.classList.add('correct');
            correctRationale = btn.dataset.rationale;
        }

        if (!isCorrect && isCurrentlySelected) {
            btn.classList.add('incorrect');
        }

        if (isCurrentlySelected) {
            const feedbackSpan = document.createElement('span');
            feedbackSpan.className = isCorrect ? 'feedback-correct' : 'feedback-incorrect';
            feedbackSpan.textContent = isCorrect ? ' ✅ Correto' : ' ❌ Erro';
            btn.insertAdjacentElement('afterend', feedbackSpan);
        }
    });

    if (qBlock.querySelector('.rationale-text')) {
        qBlock.querySelector('.rationale-text').remove();
    }

    const rationaleDiv = document.createElement('div');
    rationaleDiv.className = 'rationale-text';
    rationaleDiv.textContent = `Explicação: ${correctRationale}`;
    qBlock.appendChild(rationaleDiv);
}

// 7. Checar conclusão do bloco
function checkBlockCompletion() {
    const startIdx = currentBlock * QUESTIONS_PER_BLOCK;
    const endIdx = startIdx + QUESTIONS_PER_BLOCK;
    const blockQuestions = shuffledQuestions.slice(startIdx, endIdx);
    const answeredInBlock = blockQuestions.filter(q => userAnswers[q.id] !== undefined).length;

    if (answeredInBlock === QUESTIONS_PER_BLOCK) {
        recalculateTotalScore();

        if (currentBlock < (shuffledQuestions.length / QUESTIONS_PER_BLOCK) - 1) {
            nextButton.style.display = 'block';
            finishButton.style.display = 'none';
        } else {
            nextButton.style.display = 'none';
            finishButton.style.display = 'block';
        }

        displayBlockResults();
    } else {
        nextButton.style.display = 'none';
        finishButton.style.display = 'none';
        resultsArea.style.display = 'none';
    }
}

// 8. Recalcular pontuação total
function recalculateTotalScore() {
    totalHits = 0;
    totalErrors = 0;
    Object.values(userAnswers).forEach(answer => {
        if (answer.isCorrect) totalHits++;
        else totalErrors++;
    });
}

// 9. Exibir resultado do bloco (⭐️ CORRIGIDO PARA MENSAGENS ÚNICAS)
function displayBlockResults() {
    const startIdx = currentBlock * QUESTIONS_PER_BLOCK;
    const endIdx = startIdx + QUESTIONS_PER_BLOCK;
    const blockQuestions = shuffledQuestions.slice(startIdx, endIdx);

    let blockHits = 0;
    let blockErrors = 0;

    blockQuestions.forEach(q => {
        const answer = userAnswers[q.id];
        if (answer) {
            if (answer.isCorrect) blockHits++;
            else blockErrors++;
        }
    });

    const totalQuestions = shuffledQuestions.length;
    const currentTotalAnswered = Object.keys(userAnswers).length;

    let messageIndex;
    const LAST_MESSAGE_INDEX = motivationMessages.length - 1; 

    if (currentTotalAnswered === totalQuestions) {
        // Se todas as perguntas foram respondidas, mostra a mensagem final.
        messageIndex = LAST_MESSAGE_INDEX;
    } else {
        // Usa o índice do bloco atual (currentBlock). 
        // Garante que a mensagem final (LAST_MESSAGE_INDEX) nunca seja selecionada aqui.
        messageIndex = Math.min(currentBlock, LAST_MESSAGE_INDEX - 1);
    }
    // FIM DA CORREÇÃO

    resultsArea.innerHTML = `
        <h3>Bloco ${currentBlock + 1} Concluído!</h3>
        <p class="score-summary">Acertos no Bloco: <strong>${blockHits}</strong></p>
        <p class="score-summary">Erros no Bloco: <strong>${blockErrors}</strong></p>
        <hr>
        <p class="score-summary">Total Geral: Acertos <strong>${totalHits}</strong> / Erros <strong>${totalErrors}</strong></p>
        <p class="motivation-message">${motivationMessages[messageIndex]}</p>
    `;
    resultsArea.style.display = 'block';
}

// 10. Atualizar botões de navegação
function updateNavigationButtons() {
    backButton.style.display = currentBlock > 0 ? 'block' : 'none';
    checkBlockCompletion();
}

// 11. Navegação
nextButton.onclick = () => {
    if (currentBlock < shuffledQuestions.length / QUESTIONS_PER_BLOCK - 1) {
        currentBlock++;
        renderBlock();
    }
};

backButton.onclick = () => {
    if (currentBlock > 0) {
        currentBlock--;
        renderBlock();
    }
};

// 11. Navegação (AJUSTADA para incluir o botão SAIR)

// ... (seus códigos nextButton e backButton)

finishButton.onclick = () => {
    const totalQuestions = shuffledQuestions.length;
    quizContent.innerHTML = `
        <h2>Resultado Final do Quiz</h2>
        <p class="score-summary">Total de Perguntas: <strong>${totalQuestions}</strong></p>
        <p class="score-summary" style="color: #28a745;">Acertos Totais: <strong>${totalHits}</strong></p>
        <p class="score-summary" style="color: #dc3545;">Erros Totais: <strong>${totalErrors}</strong></p>
        <p class="score-summary">Aproveitamento: <strong>${((totalHits / totalQuestions) * 100).toFixed(2)}%</strong></p>
        <p class="motivation-message" style="font-size: 1.2em;">${motivationMessages[motivationMessages.length - 1]} Prepare-se para o próximo desafio!</p>
        
        <div class="final-buttons">
            <button class="nav-button try-again" onclick="startQuiz()">Tentar Novamente</button>
            <button class="nav-button exit-button" onclick="exitQuiz()">Sair do Quiz</button>
        </div>
    `;
    navigationArea.style.display = 'none';
    resultsArea.style.display = 'none';
};

// ⭐️ NOVA FUNÇÃO: Função para 'Sair do Quiz'
function exitQuiz() {
    quizContent.innerHTML = `
        <div class="exit-screen">
            <h2>Quiz Finalizado</h2>
            <p>Obrigado por participar! Você pode fechar esta página.</p>
        </div>
    `;
    // Esconde a área de navegação (que já estava escondida, mas é bom garantir)
    navigationArea.style.display = 'none'; 
    resultsArea.style.display = 'none';
}

// Inicia o quiz
document.addEventListener('DOMContentLoaded', loadQuestions);

