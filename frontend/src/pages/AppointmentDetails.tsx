import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User, ArrowLeft } from 'lucide-react';
import apiService from '@/lib/apiService';

const AppointmentDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const res = await apiService.appointments.getById(id);
        const apt = (res.data as any).appointment || res.data;
        setData(apt);
      } catch (e: any) {
        setError(e?.message || 'Failed to load appointment');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }
  if (!data) return null;

  const doctorName = data?.doctor?.user?.profile
    ? `Dr. ${data.doctor.user.profile.firstName} ${data.doctor.user.profile.lastName}`
    : 'Unknown Doctor';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Button variant="outline" className="mb-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#503459] to-[#81638b] flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold">{doctorName}</div>
                <div className="text-sm text-gray-600">{data?.doctor?.specialization || 'General'}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                <span>{data?.date ? new Date(data.date).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-gray-500" />
                <span>{data?.time || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                <span>{data?.hospital?.name || 'Not specified'}</span>
              </div>
            </div>

            <div>
              <span className="mr-2 font-medium">Status:</span>
              <Badge>{data?.status || 'Unknown'}</Badge>
            </div>

            {data?.reason && (
              <div>
                <div className="font-semibold mb-1">Reason</div>
                <div className="text-gray-700">{data.reason}</div>
              </div>
            )}
            {data?.notes && (
              <div>
                <div className="font-semibold mb-1">Notes</div>
                <div className="text-gray-700 whitespace-pre-wrap">{data.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppointmentDetails;
