import re

CNIC_REGEX = re.compile(r'(?<!\d)(\d{5})[-\s.]?(\d{7})[-\s.]?(\d)(?!\d)')
DOB_REGEX = re.compile(r'\b(\d{2})[./-](\d{2})[./-](\d{4})\b')


def extract_fields(text: str) -> dict[str, str | None]:
    cnic_match = CNIC_REGEX.search(text or '')
    dob_match = DOB_REGEX.search(text or '')

    cnic_value = None
    if cnic_match:
        cnic_value = f'{cnic_match.group(1)}-{cnic_match.group(2)}-{cnic_match.group(3)}'

    dob_value = None
    if dob_match:
        dob_value = f'{dob_match.group(1)}.{dob_match.group(2)}.{dob_match.group(3)}'

    return {
        'cnic': cnic_value,
        'dob': dob_value,
    }
