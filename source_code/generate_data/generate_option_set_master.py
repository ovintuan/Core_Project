import csv
import uuid
from datetime import datetime

# Load Product information from CSV file
def load_product_info(file_path):
    with open(file_path, mode='r') as file:
        reader = csv.DictReader(file)
        return list(reader)

product_info = load_product_info('./local_data_storage/master_data/ProductMasterData.csv')

# Define option set data
option_set_data = [
    {"OptionSetName": "Status", "OptionSetValue": "Active", "Description": "Active Account Status", "ReferenceTable": "CreditAccount", "ReferenceColumn": "StatusID"},
    {"OptionSetName": "Status", "OptionSetValue": "Closed", "Description": "Closed Account Status", "ReferenceTable": "CreditAccount", "ReferenceColumn": "StatusID"},
    {"OptionSetName": "Status", "OptionSetValue": "Delinquent", "Description": "Delinquent Account Status", "ReferenceTable": "CreditAccount", "ReferenceColumn": "StatusID"},
    {"OptionSetName": "TransactionType", "OptionSetValue": "Purchase", "Description": "Purchase Transaction Type", "ReferenceTable": "Transaction", "ReferenceColumn": "TransactionTypeID"},
    {"OptionSetName": "TransactionType", "OptionSetValue": "Payment", "Description": "Payment Transaction Type", "ReferenceTable": "Transaction", "ReferenceColumn": "TransactionTypeID"},
    {"OptionSetName": "PaymentMethod", "OptionSetValue": "Credit Card", "Description": "Credit Card Payment Method", "ReferenceTable": "Transaction", "ReferenceColumn": "PaymentmethodID"},
    {"OptionSetName": "PaymentMethod", "OptionSetValue": "Bank Transfer", "Description": "Bank Transfer Payment Method", "ReferenceTable": "Transaction", "ReferenceColumn": "PaymentmethodID"}
]

# Get distinct product types
distinct_product_types = {product['ProductType'] for product in product_info}

# Add product types to option set data
for product_type in distinct_product_types:
    option_set_data.append({
        "OptionSetName": "ProductType",
        "OptionSetValue": product_type,
        "Description": f"{product_type} Product Type",
        "ReferenceTable": "Product",
        "ReferenceColumn": "ProductTypeID"
    })

# Function to generate OptionSetMaster data and save to CSV
def generate_option_set_master_data(file_path, data):
    with open(file_path, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['OptionSetID', 'OptionSetName', 'OptionSetValue', 'Description', 'ReferenceTable', 'ReferenceColumn', 'CreatedDate', 'UpdateDate'])  # Write the header
        for item in data:
            writer.writerow([
                str(uuid.uuid4()),
                item['OptionSetName'],
                item['OptionSetValue'],
                item['Description'],
                item['ReferenceTable'],
                item['ReferenceColumn'],
                datetime.now().isoformat(),
                datetime.now().isoformat()
            ])

# Generate CSV for OptionSetMaster data
generate_option_set_master_data('./local_data_storage/master_data/OptionSetMasterData.csv', option_set_data)