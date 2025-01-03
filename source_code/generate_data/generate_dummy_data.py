import json
import uuid
import csv
from faker import Faker
from random import randint, uniform, choice
from datetime import datetime, timedelta



# Load IDs and product information from CSV file
def load_ids_and_product_info(file_path):
    with open(file_path, mode='r') as file:
        reader = csv.DictReader(file)
        return list(reader)

customer_product_account_ids = load_ids_and_product_info('/container/pyspark_workspace/local_data_storage/master_data/CustomerProductAccountIDs.csv')

# Load Product information from CSV file
def load_product_info(file_path):
    with open(file_path, mode='r') as file:
        reader = csv.DictReader(file)
        return {row['ProductID']: row for row in reader}

product_info = load_product_info('/container/pyspark_workspace/local_data_storage/master_data/ProductMasterData.csv')

def load_option_set(file_path):
    with open(file_path, mode='r') as file:
        reader = csv.DictReader(file)
        option_set = {}
        for row in reader:
            if row['OptionSetName'] not in option_set:
                option_set[row['OptionSetName']] = []
            option_set[row['OptionSetName']].append(row)
        return option_set

option_set_data = load_option_set('/container/pyspark_workspace/local_data_storage/master_data/OptionSetMasterData.csv')

class DummyDataGenerator:
    def __init__(self):
        self.fake = Faker('vi_VN')
        self.customer_product_account_ids = customer_product_account_ids
        self.product_info = product_info
        self.option_set_data = option_set_data

    def get_random_option_set_value(self, option_set_name):
        return choice(self.option_set_data[option_set_name])

    def generate_customer_product_account_data(self, record_id):
        product = self.product_info[record_id['ProductID']]
        status = self.get_random_option_set_value('Status')
        record = {
            "CustomerID": record_id['CustomerID'],
            "FirstName": self.fake.first_name(),
            "LastName": self.fake.last_name(),
            "DateOfBirth": self.fake.date_of_birth().isoformat(),
            "SSN": self.fake.ssn(),
            "Ward": self.fake.street_name(),
            "District": self.fake.city(),
            "City": self.fake.city(),
            "PhoneNumber": self.fake.phone_number(),
            "Email": self.fake.email(),
            "ProductID": product['ProductID'],
            "ProductName": product['ProductName'],
            "InterestRate": product['InterestRate'],
            "AccountID": record_id['AccountID'],
            "LimitAmount": round(uniform(1000.0, 50000.0), 2),
            "Balance": round(uniform(0.0, 50000.0), 2),
            "OpenDate": self.fake.date_between(start_date='-5y', end_date='today').isoformat(),
            "CloseDate": self.fake.date_between(start_date='today', end_date='+5y').isoformat(),
            "Status": status['OptionSetValue'],
            "CreatedDate": datetime.now().isoformat(),
            "UpdateDate": datetime.now().isoformat()
        }
        return record

    def generate_account_transaction_history_data(self, record_id):
        product = self.product_info[record_id['ProductID']]
        payment_method = self.get_random_option_set_value('PaymentMethod')
        transaction_type = self.get_random_option_set_value('TransactionType')
        record = {
            "AccountID": record_id['AccountID'],
            "CustomerID": record_id['CustomerID'],
            "ProductID": product['ProductID'],
            "LimitAmount": round(uniform(1000.0, 50000.0), 2),
            "Balance": round(uniform(0.0, 50000.0), 2),
            "TransactionID": str(uuid.uuid4()),
            "Amount": round(uniform(10.0, 1000.0), 2),
            "PaymentMethod": payment_method['OptionSetValue'],
            "TransactionType": transaction_type['OptionSetValue'],
            "PaymentDate": self.fake.date_time_between(start_date='-5y', end_date='now').isoformat(),
            "HistoryID": str(uuid.uuid4()),
            "CreditScore": randint(300, 850),
            "HistoryDate": self.fake.date_between(start_date='-5y', end_date='today').isoformat(),
            "CreatedDate": datetime.now().isoformat(),
            "UpdateDate": datetime.now().isoformat()
        }
        return record

    def generate_data(self, num_records):
        customer_product_account_data = []
        account_transaction_history_data = []
        for _ in range(num_records):
            record_id = choice(self.customer_product_account_ids)
            customer_data = self.generate_customer_product_account_data(record_id)
            transaction_data = self.generate_account_transaction_history_data(record_id)
            customer_product_account_data.append(customer_data)
            account_transaction_history_data.append(transaction_data)
        return customer_product_account_data, account_transaction_history_data

# # Generate and save JSON for CustomerProductAccount and AccountTransactionHistory tables
# generator = DummyDataGenerator()
# customer_product_account_data, account_transaction_history_data = generator.generate_data(10000)

# with open('CustomerProductAccount.json', 'w') as file:
#     json.dump(customer_product_account_data, file, indent=4)

# with open('AccountTransactionHistory.json', 'w') as file:
#     json.dump(account_transaction_history_data, file, indent=4)
