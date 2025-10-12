import requests

# URL do endpoint
url = "http://127.0.0.1:8000/task"

# Texto que queremos enviar
user_input_text = "Olá, este é um teste via Python requests!"

# Monta os parâmetros da query string
params = {
    "user_input": user_input_text
}

try:
    # Faz a requisição POST
    response = requests.post(url, params=params, data="")  # - data="" garante corpo vazio
    print(response.status_code)
    # Verifica se deu certo
    if response.status_code == 200:
        print("Resposta do servidor:")
        print(response.json())
    else:
        print(f"Erro {response.status_code}: {response.text}")

except requests.exceptions.RequestException as e:
    print("Ocorreu um erro na requisição:", e)
