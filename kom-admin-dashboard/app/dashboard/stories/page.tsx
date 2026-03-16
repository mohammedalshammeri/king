"use client";

import { useEffect, useState, useRef } from "react";
import { StoriesService, Story } from "../../../lib/services/stories";
import { Loader } from "../../../components/ui/loader";
import { Button } from "../../../components/ui/button";
import { useToast } from "../../../components/ui/toast";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";

type Tab = "pending" | "active";

export default function StoriesPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [pendingStories, setPendingStories] = useState<Story[]>([]);
  const [activeStories, setActiveStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { pushToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const [pending, active] = await Promise.all([
        StoriesService.getPending(),
        StoriesService.getActive(),
      ]);
      setPendingStories(pending || []);
      setActiveStories(active || []);
    } catch (err) {
      console.error(err);
      pushToast({ message: "فشل تحميل القصص", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') await StoriesService.approve(id);
      else await StoriesService.reject(id);
      
      pushToast({ message: `تم ${action === 'approve' ? 'قبول' : 'رفض'} القصة`, type: "success" });
      setPendingStories(prev => prev.filter(s => s.id !== id));
      if (action === 'approve') fetchStories(); // refresh active list too
    } catch (e) {
      console.error(e);
      pushToast({ message: "فشل تنفيذ العملية", type: "error" });
    }
  };

  const handleDelete = async (id: string, fromTab: Tab) => {
    if (!confirm('هل أنت متأكد من حذف هذه القصة؟')) return;
    try {
      await StoriesService.deleteStory(id);
      pushToast({ message: 'تم حذف القصة', type: 'success' });
      if (fromTab === 'pending') setPendingStories(prev => prev.filter(s => s.id !== id));
      else setActiveStories(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error(e);
      pushToast({ message: 'فشل حذف القصة', type: 'error' });
    }
  };

  const handleUploadStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const isVideo = file.type.startsWith('video/');
      const mediaType = isVideo ? 'VIDEO' : 'IMAGE';
      
      setUploading(true);
      try {
          await StoriesService.create(file, mediaType);
          pushToast({ message: "تم نشر القصة مباشرةً في التطبيق", type: "success" });
          await fetchStories();
          setTab("active"); // Switch to active tab to see the new story
      } catch (e) {
          console.error(e);
          pushToast({ message: "فشل رفع القصة", type: "error" });
      } finally {
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const stories = tab === "pending" ? pendingStories : activeStories;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-black/60">
        <Loader />
        جاري تحميل القصص...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">إدارة القصص</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,video/*"
                onChange={handleUploadStory}
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full sm:w-auto">
                {uploading ? 'جاري الرفع...' : 'إضافة قصة كمسؤول'}
            </Button>
            <Button onClick={fetchStories} variant="outline" className="w-full sm:w-auto">تحديث</Button>
        </div>
      </div>

      {/* Info banner for admins */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
        💡 قصص المسؤول تُنشر مباشرةً في التطبيق دون مراجعة. قصص المستخدمين تحتاج للموافقة أولاً.
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab("pending")}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "pending"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          معلّقة
          <span className={`mr-2 px-2 py-0.5 rounded-full text-xs ${
            tab === "pending" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
          }`}>
            {pendingStories.length}
          </span>
        </button>
        <button
          onClick={() => setTab("active")}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "active"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          نشطة
          <span className={`mr-2 px-2 py-0.5 rounded-full text-xs ${
            tab === "active" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
          }`}>
            {activeStories.length}
          </span>
        </button>
      </div>

      {stories.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-black/10 bg-white p-8 text-center">
            <h3 className="text-lg font-semibold">
              {tab === "pending" ? "لا توجد قصص معلقة" : "لا توجد قصص نشطة"}
            </h3>
            <p className="mt-1 text-sm text-black/60">
              {tab === "pending" ? "جميع القصص تمت مراجعتها" : "لم يتم نشر أي قصص بعد"}
            </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stories.map(story => (
            <Card key={story.id} className="overflow-hidden flex flex-col p-0">
                <div className="relative aspect-[9/16] bg-black">
                   {story.mediaType === 'VIDEO' ? (
                       <video src={story.mediaUrl} controls className="w-full h-full object-contain" />
                   ) : (
                       <img src={story.mediaUrl} className="w-full h-full object-contain" />
                   )}
                   <div className="absolute top-2 right-2">
                     <Badge variant={story.mediaType === 'VIDEO' ? 'default' : 'secondary'}>
                        {story.mediaType === 'VIDEO' ? 'فيديو' : 'صورة'}
                     </Badge>
                   </div>
                   <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                       {story.duration} ثانية
                   </div>
                   {tab === "active" && (
                     <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                       نشطة
                     </div>
                   )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                         <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                             {story.user?.avatarUrl ? (
                                 <img src={story.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold">
                                     {story.user?.fullName?.charAt(0) || '?'}
                                 </div>
                             )}
                         </div>
                         <div className="min-w-0">
                             <p className="font-semibold text-sm truncate">{story.user?.fullName || story.user?.email}</p>
                             <p className="text-gray-500 text-xs truncate" dir="rtl">{new Date(story.createdAt).toLocaleString('en-GB')}</p>
                         </div>
                    </div>
                    {tab === "pending" && (
                      <div className="mt-auto grid grid-cols-2 gap-3">
                          <Button 
                              className="bg-emerald-600 hover:bg-emerald-700 text-white" 
                              onClick={() => handleAction(story.id, 'approve')}
                          >
                              قبول
                          </Button>
                          <Button 
                              variant="destructive"
                              onClick={() => handleAction(story.id, 'reject')}
                          >
                              رفض
                          </Button>
                          <Button
                              variant="outline"
                              className="col-span-2 border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(story.id, 'pending')}
                          >
                              🗑️ حذف نهائياً
                          </Button>
                      </div>
                    )}
                    {tab === "active" && (
                      <div className="mt-auto">
                          <Button
                              variant="outline"
                              className="w-full border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(story.id, 'active')}
                          >
                              🗑️ حذف القصة
                          </Button>
                      </div>
                    )}
                </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
