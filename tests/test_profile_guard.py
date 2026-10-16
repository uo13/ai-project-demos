import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
from hualing_profile_guard import guard_profile_arguments

class ProfileGuardTests(unittest.TestCase):
    def setUp(self):self.profiles=[{'record_id':'a','birth_info':{'year':2000}},{'record_id':'b','birth_info':{'year':2001}}]
    def test_selected_second_matches_payload(self):
        out=guard_profile_arguments('five_elements',{'record_id':'b','birth_info':{'year':2000}},self.profiles,{'record_id':'b'})
        self.assertEqual(out['birth_info'],{'year':2001})
    def test_id_query_drops_stale_birth(self):self.assertNotIn('birth_info',guard_profile_arguments('ziwei_chart',{'record_id':'a','birth_info':{'year':1990}},[],{}))
    def test_multiple_profiles_need_explicit_choice(self):
        with self.assertRaises(ValueError):guard_profile_arguments('five_elements',{'record_id':'a'},self.profiles,{})
    def test_unknown_selected_profile_rejected(self):
        with self.assertRaises(ValueError):guard_profile_arguments('five_elements',{'record_id':'outside'},self.profiles,{'record_id':'b'})
    def test_no_mutation(self):
        normalized={'record_id':'b'};out=guard_profile_arguments('five_elements',normalized,self.profiles,{'record_id':'b'});out['birth_info']['year']=9
        self.assertEqual(self.profiles[1]['birth_info']['year'],2001);self.assertEqual(normalized,{'record_id':'b'})
    def test_missing_authoritative_data_rejected(self):
        with self.assertRaises(ValueError):guard_profile_arguments('five_elements',{'record_id':'a'},[{'record_id':'a'}],{})

if __name__=='__main__':unittest.main()
