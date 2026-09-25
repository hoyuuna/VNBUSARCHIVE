import re

with open('_core.html', 'r', encoding='utf-8') as f:
    code = f.read()

# Update custom-alert-content
code = code.replace(
    'class="bg-white rounded-lg shadow-2xl max-w-sm w-full border border-gray-200 overflow-hidden transform transition-all"',
    'class="bg-white rounded-lg max-w-sm w-full border border-black overflow-hidden transform transition-all"'
)

# Update custom-alert-icon
code = code.replace(
    'class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4"',
    'class="mx-auto flex items-center justify-center h-12 w-12 rounded-full border border-black mb-4"'
)

# Update custom-alert-title
code = code.replace(
    'class="text-lg font-bold text-gray-900 mb-2"',
    'class="text-lg font-bold text-black mb-2"'
)

# Update custom-alert-msg
code = code.replace(
    'class="text-sm text-gray-500"',
    'class="text-sm text-black"'
)

# Update custom-alert-cancel-btn
code = code.replace(
    'class="hidden mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition"',
    'class="hidden mt-3 w-full inline-flex justify-center rounded-md border border-black px-4 py-2 bg-white text-base font-medium text-black hover:bg-gray-100 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition"'
)

# Update the OTP inputs that I injected earlier which used border-gray-300
code = code.replace('class="w-full border border-gray-300 p-2.5 text-sm rounded-md focus:ring-2 focus:ring-black outline-none"', 'class="w-full border border-black p-2.5 text-sm rounded-md focus:outline-none"')
code = code.replace('class="w-full border border-gray-300 p-2.5 text-sm rounded-md focus:ring-2 focus:ring-black outline-none tracking-widest text-center"', 'class="w-full border border-black p-2.5 text-sm rounded-md focus:outline-none tracking-widest text-center"')

with open('_core.html', 'w', encoding='utf-8') as f:
    f.write(code)
